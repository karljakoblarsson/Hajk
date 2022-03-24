import { ACTIVITIES, MAX_REMOVED_FEATURES } from "../constants";
import LocalStorageHelper from "../../../utils/LocalStorageHelper";
import { Circle, Fill, Stroke } from "ol/style";
import GeoJSON from "ol/format/GeoJSON";
import { Circle as CircleGeometry, Point } from "ol/geom";

import { STROKE_DASHES } from "../constants";

class SketchModel {
  #geoJSONParser;
  #storageKey;
  #dateTimeOptions;
  #drawModel;

  constructor(settings) {
    this.#geoJSONParser = new GeoJSON();
    this.#storageKey = settings.storageKey || "sketch";
    this.#dateTimeOptions = {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };
    this.#drawModel = settings.drawModel;
  }

  // Updates the removed features in the local-storage
  #setStoredRemovedFeatures = (removedFeatures) => {
    LocalStorageHelper.set(this.#storageKey, {
      ...LocalStorageHelper.get(this.#storageKey),
      removedFeatures: removedFeatures,
    });
  };

  // Updates the stored sketches in the local-storage
  #setStoredSketches = (sketches) => {
    LocalStorageHelper.set(this.#storageKey, {
      ...LocalStorageHelper.get(this.#storageKey),
      sketches: sketches,
    });
  };

  // Creates an object containing all the supplied properties along with
  // all the (not currently hidden) features currently in the sketch-layer.
  #createSketchObject = (sketchInformation) => {
    return {
      ...sketchInformation,
      id: this.generateRandomString(),
      date: this.getDateTimeString(),
      features: this.#drawModel
        .getAllDrawnFeatures()
        .filter((f) => f.get("HIDDEN") !== true)
        .map((f) => this.#prepareFeatureForStorage(f)),
    };
  };

  // Since we cannot save the OL-features directly in local-storage without
  // loosing some information, we'll have to parse the feature to a geoJSON
  // before we store it. We also have to decorate the feature with some style-information
  // so that we can extract the style when adding the feature to the map again;
  #prepareFeatureForStorage = (f) => {
    // So first, we'll decorate the feature with its style-information
    f.set("EXTRACTED_STYLE", this.#drawModel.extractFeatureStyleInfo(f));
    // If the feature to be saved consists of a Circle-geometry we have to
    // update the geometry to something that geoJSON can handle.
    if (f.getGeometry() instanceof CircleGeometry) {
      this.#createFriendlyCircleGeom(f);
    }
    // Then we'll create the geoJSON, and return that.
    return this.#geoJSONParser.writeFeature(f);
  };

  // Returns the activity-object connected to the supplied id
  getActivityFromId = (id) => {
    return ACTIVITIES.find((activity) => {
      return activity.id === id;
    });
  };

  // Returns the current date and time on YYYY-MM-DD HH:MM:SS
  getDateTimeString = (options) => {
    const date = new Date();
    return date.toLocaleString("default", options || this.#dateTimeOptions);
  };

  // Generates a random string that can be used as an ID.
  generateRandomString = () => {
    return Math.random().toString(36).slice(2, 9);
  };

  // Accepts an array containing the line-dash, and returns the line (stroke) type
  // that corresponds to that value.
  #getStrokeType = (lineDash) => {
    for (const [key, value] of STROKE_DASHES.entries()) {
      // The value and actual line-dash might be null, lets check if they
      // both are: (If they are, the line-type is "solid").
      if (value === lineDash) {
        return key;
      }
      // The value might also be an array, and "===" will therefore check for reference equality.
      // Which will obviously not work, since they are not pointing to the same object. Instead,
      // let's check if the arrays has the same content. (We don't care about the array order).
      if (
        Array.isArray(value) &&
        Array.isArray(lineDash) &&
        value.every((v) => lineDash.includes(v))
      ) {
        return key;
      }
    }
    // If it wasn't found, we'll log an error and return null.
    console.error(
      `Could not find corresponding stroke-type from supplied line-dash. The supplied line-dash was: ${lineDash}`
    );
    return null;
  };

  // Extract the style settings from the supplied object and returns an object
  // with the color settings converted to string to comply with OL.
  #extractStyleSettings = (settings) => {
    const { strokeColor, fillColor, strokeWidth, lineDash } = settings;
    const strokeColorString = this.#drawModel.getRGBAString(strokeColor);
    const fillColorString = this.#drawModel.getRGBAString(fillColor);
    return {
      strokeColor: strokeColorString,
      fillColor: fillColorString,
      strokeWidth,
      lineDash,
    };
  };

  // Creates a circle-style that can be used within an image-style.
  #createImageStyle = (settings) => {
    return new Circle({
      radius: 6,
      stroke: new Stroke({
        color: settings.strokeColor,
        width: settings.strokeWidth,
        lineDash: settings.lineDash,
      }),
      fill: new Fill({
        color: settings.fillColor,
      }),
    });
  };

  // Accepts a feature with a Circle-geometry and updates the feature-geometry
  // to a Point-geometry along with an additional property ("CIRCLE_RADIUS") that can
  // be used to construct a "real" Circle-geometry when the feature is to be added to
  // a map. This is done since the geoJSON-standard does not accept Circle-geometries.
  #createFriendlyCircleGeom = (feature) => {
    try {
      const geometry = feature.getGeometry();
      const center = geometry.getCenter();
      const radius = geometry.getRadius();
      feature.set("CIRCLE_RADIUS", radius);
      feature.set("CIRCLE_CENTER", JSON.stringify(center));
      feature.setGeometry(new Point(center));
    } catch (error) {
      console.error(
        `Could not create a geoJSON-friendly circle-geometry. Error: ${error}`
      );
    }
  };

  // Returns the feature-style in a form that fits the feature-style-editor
  getFeatureStyle = (feature) => {
    try {
      // We're gonna need the base-style of the feature
      const featureBaseStyle = this.#drawModel.extractFeatureStyleInfo(feature);
      // Then we'll extract the text-settings. (These might be undefined, and
      // are only set if we are dealing with a text-feature).
      const featureTextStyle = feature.get("TEXT_SETTINGS");
      // Then we'll construct the feature-style-object and return it.
      return {
        strokeColor: this.#drawModel.parseColorString(
          featureBaseStyle?.strokeStyle.color
        ),
        lineDash: featureBaseStyle?.strokeStyle.dash,
        strokeWidth: featureBaseStyle?.strokeStyle.width,
        strokeType: this.#getStrokeType(featureBaseStyle?.strokeStyle.dash),
        fillColor: this.#drawModel.parseColorString(
          featureBaseStyle?.fillStyle.color
        ),
        textForegroundColor: featureTextStyle?.foregroundColor,
        textBackgroundColor: featureTextStyle?.backgroundColor,
        textSize: featureTextStyle?.size,
      };
    } catch (error) {
      console.error(`Failed to get feature-style: Error: ${error}`);
      return null;
    }
  };

  // Applies the supplied style on the supplied feature.
  setFeatureStyle = (feature, styleSettings) => {
    try {
      // First we'll have to get the base-style. (If we're dealing
      // with an arrow-feature, the base-style is the first element of the array
      // returned from the getStyle-method).
      const featureStyle = Array.isArray(feature.getStyle())
        ? feature.getStyle()[0]
        : feature.getStyle();
      // Then we'll get the stroke and text-style
      const fillStyle = featureStyle.getFill();
      const strokeStyle = featureStyle.getStroke();
      const imageStyle = featureStyle.getImage();

      const { fillColor, strokeColor, strokeWidth, lineDash } =
        this.#extractStyleSettings(styleSettings);

      fillStyle.setColor(fillColor);
      strokeStyle.setColor(strokeColor);
      strokeStyle.setWidth(strokeWidth);
      strokeStyle.setLineDash(lineDash);
      // Unfortunately, the feature-image-style does not update by re-setting the
      // stroke- and fill-settings within the image-style. Instead, a new image-style
      // has to be created.
      imageStyle &&
        featureStyle.setImage(
          this.#createImageStyle({
            fillColor,
            strokeColor,
            strokeWidth,
            lineDash,
          })
        );

      // If we're dealing with a text.feature, the text-style-settings must be updated as well.
      if (feature.get("DRAW_METHOD") === "Text") {
        feature.set("TEXT_SETTINGS", {
          size: styleSettings.textSize,
          foregroundColor: styleSettings.textForegroundColor,
          backgroundColor: styleSettings.textBackgroundColor,
        });
      }
    } catch (error) {
      console.error(`Failed to apply the supplied style. Error: ${error}`);
    }
  };

  // When a feature is removed, we should usually add it to the list of
  // removed features. However, there are a couple of cases where we should not!
  // -1: If we've added a text-feature, and the user has chosen to abort the
  // input of text to apply to the feature, we make sure to remove it, and
  // that removed feature should not be shown in the list of removed features.
  // -2: If the feature is currently hidden, we shouldn't add it to the storage.
  featureShouldBeAddedToStorage = (feature) => {
    return (
      !(feature.get("DRAW_METHOD") === "Text" && !feature.get("USER_TEXT")) ||
      feature.get("HIDDEN") === true
    );
  };

  // We're gonna need to set some properties on the handled feature so that we can keep
  // track of it. (The "HANDLED_AT" prop will show the user at what time the feature was
  // removed, and the "HANDLED_ID" will be used if the user choses to restore the feature).
  decorateFeature = (feature) => {
    feature.set(
      "EXTRACTED_STYLE",
      this.#drawModel.extractFeatureStyleInfo(feature)
    );
    feature.set("HANDLED_AT", this.getDateTimeString());
    feature.set("HANDLED_ID", this.generateRandomString());
    // If the feature to be saved consists of a Circle-geometry we have to
    // update the geometry to something that geoJSON can handle.
    if (feature.getGeometry() instanceof CircleGeometry) {
      this.#createFriendlyCircleGeom(feature);
    }
  };

  // Returns the earlier removed features which are stored in local-storage
  // If the first parameter is omitted, the method will return parsed OL-features,
  // otherwise, it will return the actual local-storage value.
  getRemovedFeaturesFromStorage = (returnType = "FEATURES") => {
    const inStorage = LocalStorageHelper.get(this.#storageKey);
    const storedFeatures = inStorage["removedFeatures"] || [];
    return returnType === "FEATURES"
      ? storedFeatures.map((parsedFeature) =>
          this.#geoJSONParser.readFeature(parsedFeature)
        )
      : storedFeatures;
  };

  // Returns sketches that has been saved to local-storage.
  getSketchesFromStorage = () => {
    const inStorage = LocalStorageHelper.get(this.#storageKey);
    const storedSketches = inStorage["sketches"] || [];
    return storedSketches;
  };

  // Updates the local-storage by adding the removed feature and potentially
  // removing old removed features. (We want to keep a maximum of MAX_REMOVED_FEATURES).
  addFeatureToStorage = (feature) => {
    const removedFeatures = this.getRemovedFeaturesFromStorage("STRINGS");
    const parsedFeature = this.#geoJSONParser.writeFeature(feature);
    this.#setStoredRemovedFeatures([
      parsedFeature,
      ...removedFeatures.slice(0, MAX_REMOVED_FEATURES - 1),
    ]);
  };

  // Updates the local-storage by adding a new sketch containing all the features currently
  // in the the sketch-layer. If a sketch with the same id as the one supplied one already exist,
  // the already stored sketch will be over-written.
  addCurrentSketchToStorage = (sketchInfo) => {
    // First we'll make sure to remove any potential sketch (with same title) already in storage.
    // We do this since we don't allow for multiple sketches with the same title.
    this.removeSketchFromStorage(sketchInfo);
    // Then we'll create a sketch (an object containing the supplied sketch-information along with the
    // features currently existing in the sketch-layer).
    const sketch = this.#createSketchObject(sketchInfo);
    // Then we'll get all the currently stored sketches.
    const storedSketches = this.getSketchesFromStorage();
    // Then we'll update the stored sketches with the supplied one.
    this.#setStoredSketches([sketch, ...storedSketches]);
  };

  // Adds the features in the supplied sketch to the map by first parsing them
  // (they are stored as geoJSON, and we want to add them as OL-features).
  addSketchToMap = (sketch) => {
    sketch.features.forEach((f) => {
      this.#drawModel.addFeature(this.#geoJSONParser.readFeature(f));
    });
  };

  // Updates the local-storage by removing the feature corresponding to the supplied id
  removeFeatureFromStorage = (id) => {
    const storedFeatures = this.getRemovedFeaturesFromStorage("STRINGS");
    this.#setStoredRemovedFeatures(
      storedFeatures.filter((f) => !f.includes(id))
    );
  };

  // Updates the local-storage by removing the sketch corresponding to the supplied title.
  // Why title and not an id? Since we dont allow for multiple sketches with the same title, we can
  // use the title as an id. Another reason is that in some cases, we generate an id after we've made sure
  // to remove potential sketches with the same title.
  removeSketchFromStorage = (sketch) => {
    const storedSketches = this.getSketchesFromStorage();
    this.#setStoredSketches(
      storedSketches.filter(
        (s) => !this.equalsIgnoringCase(s.title, sketch.title)
      )
    );
  };

  // Checks if two strings are equal, ignoring case.
  equalsIgnoringCase = (s1, s2) => {
    // If two strings were not supplied, we'll return false.
    if (typeof s1 !== "string" || typeof s2 !== "string") {
      return false;
    }
    // Otherwise we'll return the result of a lowercase-compare.
    return s1.toLowerCase() === s2.toLowerCase();
  };
}
export default SketchModel;