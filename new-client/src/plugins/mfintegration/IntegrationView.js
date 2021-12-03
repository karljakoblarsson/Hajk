import React from "react";
import PropTypes from "prop-types";
import { withSnackbar } from "notistack";
import { withStyles } from "@material-ui/core/styles";
import {
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItem,
} from "@material-ui/core";
import TouchAppIcon from "@material-ui/icons/TouchApp";
import Crop32Icon from "@material-ui/icons/Crop32";
import CancelOutlinedIcon from "@material-ui/icons/CancelOutlined";
import ItemList from "./components/ItemList";

const styles = (theme) => {
  return {
    dropdown: {
      width: "50%",
    },
    listHeading: {
      fontWeight: theme.typography.fontWeightMedium,
    },
    itemList: {
      maxHeight: 250,
      overflowY: "scroll",
      overflowX: "hidden",
    },
  };
};

const defaultState = {
  mode: "realEstate",
  currentListResults: {
    realEstate: [],
    coordinate: [],
    geometry: [],
  },
};

//TODO - Move this out to config.
const informationText =
  "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Fugiat officiis quam incidunt cupiditate quisquam tempore minima cumque exercitationem omnis ratione!";

//TODO - move this? where to place constant information on the different modes - the model?
const modeDisplay = {
  realEstate: { displayName: "Fastighet", displayNamePlural: "Fastigheter" },
  coordinate: { displayName: "Koordinat", displayNamePlural: "Koordinater" },
  geometry: { displayName: "Geometri", displayNamePlural: "Geometrier" },
  controlObject: {
    displayName: "Tillsynsobjekt",
    displayNamePlural: "Tillsynsobjekt",
  },
};

class IntegrationView extends React.PureComponent {
  state = defaultState;

  static propTypes = {
    model: PropTypes.object.isRequired,
    app: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    localObserver: PropTypes.object.isRequired,
    globalObserver: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.globalObserver = props.globalObserver;
    this.localObserver = props.localObserver;
    this.#bindSubscriptions();
  }

  #bindSubscriptions = () => {
    this.localObserver.subscribe("window-opened", () => {
      console.log("IntegrationView - window-opened");
    });
    this.localObserver.subscribe(
      "mf-wfs-map-updated-features-real-estates",
      (props) => {
      this.#updateRealEstateList(props);
      }
    );
    this.localObserver.subscribe(
      "mf-wfs-map-updated-features-coordinates",
      (props) => {
        this.#updateCoordinateList(props);
      }
    );
  };

  #updateRealEstateList = (props) => {
    let id = -1;
    const realEstateData = props.features.map((feature) => {
      const properties = feature.getProperties();
      return {
        id: ++id,
        fnr: properties[props.propertyName],
        mapId: feature.ol_uid,
        fnr: properties.fnr_fr,
        name: properties.fastighet,
        municipality: properties.trakt,
        information: `Information om fastighet ${id}`,
      };
    });
    this.#clearRealEstateList();
    this.setState({
      currentListResults: {
        ...this.state.currentListResults,
        realEstate: realEstateData,
      },
    });
  };

  #updateCoordinateList = (coordinates) => {
    let id = -1;
    const coordinateData = [...coordinates].map((coordinate) => {
      coordinate.id = ++id;
      if (coordinate.Label.length > 0) {
        coordinate.name = coordinate.Label;
        return coordinate;
      }
      coordinate.name =
        "(" + coordinate.Northing + "; " + coordinate.Easting + ")";
      return coordinate;
    });
    this.setState({
      currentListResults: {
        ...this.state.currentListResults,
        coordinate: coordinateData,
      },
    });
  };

  toggleMode = (mode) => {
    this.setState({
      mode: mode,
    });
  };

  removeFromResults = (item, mode) => {
    let updateList = { ...this.state.currentListResults };
    const updatedResults = updateList[mode].filter(
      (listItem) => listItem.id !== item.id
    );

    updateList[mode] = updatedResults;
    this.setState({ currentListResults: updateList });

    //also need to move from results list.
    this.props.model.removeRealEstateItemFromSource(item);
  };

  #clearResults = () => {
    if (this.state.mode === "realEstate") this.#clearResultsRealEstate();
    if (this.state.mode === "coordinate") this.#clearResultsCoordinates();
  };

  #clearResultsRealEstate = () => {
    this.setState({
      currentListResults: {
        ...this.state.currentListResults,
        realEstate: [],
      },
    });
    this.props.model.clearResultsRealEstate();
  };

  #clearResultsCoordinates = () => {
    this.setState({
      currentListResults: {
        ...this.state.currentListResults,
        coordinate: [],
      },
    });
    this.props.model.clearResultsCoordinate();
  };

  #clearRealEstateList = () => {
    this.setState({ currentListResults: defaultState.currentListResults });
  };

  render() {
    const { classes } = this.props;
    const { mode } = this.state;
    return (
      <>
        <Typography>{informationText}</Typography>
        <br />
        <div style={{ marginBottom: 20 }}>
          <FormControl className={classes.dropdown}>
            <InputLabel htmlFor="modeSelection">Välj kartobjekt</InputLabel>
            <Select
              id="modeSelection"
              value={mode}
              onChange={(e) => {
                this.toggleMode(e.target.value);
              }}
            >
              <MenuItem value={"realEstate"}>Fastigheter</MenuItem>
              <MenuItem value={"coordinate"}>Koordinater</MenuItem>
              <MenuItem value={"geometry"}>Geometrier</MenuItem>
              <MenuItem value={"controlObject"}>Tillsynsobjekt</MenuItem>
            </Select>
          </FormControl>
        </div>
        <div style={{ marginBottom: 20 }}>
          <Typography variant="subtitle1" className={classes.listHeading}>
            {`Markerade ${modeDisplay[mode]["displayNamePlural"]}`}
            {this.state.currentListResults[mode].length > 0
              ? ` (${this.state.currentListResults[mode].length})`
              : null}
          </Typography>
          <div>
            {this.state.currentListResults[mode].length > 0 ? (
              <div className={classes.itemList}>
                {this.state.currentListResults[mode].map((item) => (
                  <ItemList
                    key={item.id}
                    item={item}
                    listMode={mode}
                    handleRemoveItem={(item, mode) => {
                      this.removeFromResults(item, mode);
                    }}
                  />
                ))}
              </div>
            ) : (
              `Inga ${modeDisplay[mode]["displayNamePlural"]} valda.`
            )}
          </div>
        </div>
        <div>
          <ListItem style={{ paddingLeft: "0px" }}>
            <Button
              startIcon={<TouchAppIcon />}
              onClick={() => {
                this.props.model.drawPoint();
              }}
              color="primary"
              variant="contained"
            >
              Markera/Avmarkera
            </Button>
          </ListItem>
          <ListItem style={{ paddingLeft: "0px" }}>
            <Button
              startIcon={<Crop32Icon />}
              onClick={() => {
                this.props.model.drawPolygon();
              }}
              color="primary"
              variant="contained"
            >
              Markera med polygon
            </Button>
          </ListItem>
          <ListItem style={{ paddingLeft: "0px" }}>
            <Button
              startIcon={<CancelOutlinedIcon />}
              onClick={() => {
                this.#clearResultsRealEstate();
              }}
              color="primary"
              variant="contained"
            >
              Ta bort alla markeringar
            </Button>
          </ListItem>
          <ListItem style={{ paddingLeft: "0px" }}>
            <Button
              startIcon={<CancelOutlinedIcon />}
              onClick={() => {
                this.props.model.testWfsList();
              }}
              color="primary"
              variant="contained"
            >
              Testa wfs-anrop med lista
            </Button>
          </ListItem>
        </div>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(IntegrationView));