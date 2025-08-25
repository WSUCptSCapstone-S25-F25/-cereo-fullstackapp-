import React from 'react';

function LayerPanel({
    isOpen,
    onClose,
    layerVisibility,
    areaVisibility,
    handleLayerCheckbox,
    handleAreaCheckbox,
}) {
    if (!isOpen) return null;

    return (
        <div className="layer-panel">
            <div className="layer-panel-header">
                <h3 style={{ margin: 0 }}>Layers</h3>
                <button
                    className="layer-panel-close-btn"
                    onClick={onClose}
                    title="Close"
                >
                    &times;
                </button>
            </div>
            <div style={{ marginTop: 20 }}>
                {/* Card marker checkboxes */}
                <div style={{ marginBottom: 16 }}>
                    <strong>Card Markers</strong>
                    <label style={{ display: "block", marginBottom: 8, marginTop: 8 }}>
                        <input
                            type="checkbox"
                            checked={layerVisibility.River}
                            onChange={() => handleLayerCheckbox("River")}
                        />{" "}
                        River Card
                    </label>
                    <label style={{ display: "block", marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={layerVisibility.Watershed}
                            onChange={() => handleLayerCheckbox("Watershed")}
                        />{" "}
                        Watershed Card
                    </label>
                    <label style={{ display: "block", marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={layerVisibility.Places}
                            onChange={() => handleLayerCheckbox("Places")}
                        />{" "}
                        Places Card
                    </label>
                </div>
                {/* Colored area checkboxes */}
                <div>
                    <strong>Colored Areas</strong>
                    <label style={{ display: "block", marginBottom: 8, marginTop: 8 }}>
                        <input
                            type="checkbox"
                            checked={areaVisibility.River}
                            onChange={() => handleAreaCheckbox("River")}
                        />{" "}
                        River Area
                    </label>
                    <label style={{ display: "block", marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={areaVisibility.Watershed}
                            onChange={() => handleAreaCheckbox("Watershed")}
                        />{" "}
                        Watershed Area
                    </label>
                    <label style={{ display: "block", marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={areaVisibility.Places}
                            onChange={() => handleAreaCheckbox("Places")}
                        />{" "}
                        Places Area
                    </label>
                </div>
            </div>
        </div>
    );
}

export default LayerPanel;