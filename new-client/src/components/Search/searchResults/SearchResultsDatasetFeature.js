import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Checkbox, Typography, Tooltip, Grid } from "@material-ui/core";
import Favorite from "@material-ui/icons/Favorite";
import FavoriteBorder from "@material-ui/icons/FavoriteBorder";

const styles = (theme) => ({
  root: {
    minHeight: 42,
    width: "100%",
  },
  originIconWrapper: {
    paddingLeft: theme.spacing(1),
  },
  typography: {
    maxWidth: "100%",
  },
});

class SearchResultsDatasetFeature extends React.PureComponent {
  renderShowInMapCheckbox = () => {
    const { visibleInMap } = this.props;
    const helpText = !visibleInMap ? "Visa i kartan" : "Dölj från kartan";

    return (
      <Grid item align="center">
        <Tooltip title={helpText}>
          <Checkbox
            color="default"
            disableRipple
            checked={visibleInMap}
            onClick={(e) => e.stopPropagation()}
            onChange={this.handleCheckboxToggle}
            icon={<FavoriteBorder />}
            checkedIcon={<Favorite />}
          />
        </Tooltip>
      </Grid>
    );
  };

  handleCheckboxToggle = () => {
    const {
      feature,
      featureTitle,
      source,
      visibleInMap,
      addFeatureToSelected,
      removeFeatureFromSelected,
    } = this.props;
    if (visibleInMap) {
      removeFeatureFromSelected(feature);
    } else {
      feature.source = source;
      addFeatureToSelected({
        feature: feature,
        sourceId: source?.id,
        featureTitle: featureTitle,
        initiator: "userSelect",
      });
    }
  };

  renderOriginBasedIcon = () => {
    const { getOriginBasedIcon, origin, classes } = this.props;
    return (
      <Grid className={classes.originIconWrapper}>
        {getOriginBasedIcon(origin)}
      </Grid>
    );
  };

  render() {
    const { feature, featureTitle, classes } = this.props;
    if (featureTitle.length > 0) {
      return (
        <Grid container alignItems="center" className={classes.root}>
          {feature.geometry
            ? this.renderShowInMapCheckbox()
            : this.renderOriginBasedIcon()}
          <Grid item xs={9}>
            <Typography noWrap align="left" className={classes.typography}>
              {featureTitle}
            </Typography>
          </Grid>
          <Grid item xs={1}></Grid>
        </Grid>
      );
    } else {
      return null;
    }
  }
}
export default withStyles(styles)(SearchResultsDatasetFeature);
