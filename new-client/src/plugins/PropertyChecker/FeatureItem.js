import React, { useEffect } from "react";
import { ListItem, ToggleButton, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

const FeatureItem = (props) => {
  console.log("props: ", props);
  const id = props.feature.get("id");
  const caption = props.feature.get("caption");
  const { globalObserver } = props;

  const [olLayer] = React.useState(() =>
    props.olMap.getAllLayers().find((l) => l.get("name") === id)
  );

  const isLayerVisible = () => {
    return props.olMap
      .getAllLayers()
      .find((l) => l.get("name") === id)
      .getVisible();
  };

  // Determine state from current visibility
  const [selected, setSelected] = React.useState(isLayerVisible);

  const layerVisibilityChanged = (e) => {
    if (e.oldValue === false) {
      // Layer became visible, ensure its toggle button state
      // is set to true
      setSelected(true);
    } else {
      setSelected(false);
    }
  };

  React.useEffect(() => {
    olLayer.on("change:visible", layerVisibilityChanged);
    // Cleanup function can be created as follows:
    return () => {
      olLayer.un("change:visible", layerVisibilityChanged);
    };
  }, [olLayer]);

  useEffect(() => {
    console.log("selected is now", selected);
    selected === true
      ? globalObserver.publish("layerswitcher.showLayer", olLayer)
      : globalObserver.publish("layerswitcher.hideLayer", olLayer);
  }, [globalObserver, olLayer, selected]);

  return (
    <ListItem>
      <ToggleButton
        value="check"
        selected={selected}
        onChange={() => {
          setSelected(!selected);
        }}
      >
        <CheckIcon />
      </ToggleButton>
      <Typography>{caption}</Typography>
    </ListItem>
  );
};

export default FeatureItem;
