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
                <h3 style={{ margin: 0 }}>Toggle Layers</h3>
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
                    <strong>Filter by Card Category</strong>
                    <label style={{ display: "block", marginBottom: 8, marginTop: 8 }}>
                        <input
                            type="checkbox"
                            checked={layerVisibility.River}
                            onChange={() => handleLayerCheckbox("River")}
                        />{" "}
                        River Cards
                    </label>
                    <label style={{ display: "block", marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={layerVisibility.Watershed}
                            onChange={() => handleLayerCheckbox("Watershed")}
                        />{" "}
                        Watershed Cards
                    </label>
                    <label style={{ display: "block", marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={layerVisibility.Places}
                            onChange={() => handleLayerCheckbox("Places")}
                        />{" "}
                        Places Cards
                    </label>
                </div>
                {/* Colored area checkboxes */}
                <div>
                    <strong>Filter by Spatial Area Category</strong>
                    <label style={{ display: "block", marginBottom: 8, marginTop: 8 }}>
                        <input
                            type="checkbox"
                            checked={areaVisibility.River}
                            onChange={() => handleAreaCheckbox("River")}
                        />{" "}
                        Hydrological Boundaries
                    </label>
                    {/*
                    <label style={{ display: "block", marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={areaVisibility.Watershed}
                            onChange={() => handleAreaCheckbox("Watershed")}
                        />{" "}
                        Watershed Area
                    </label> */}
                    <label style={{ display: "block", marginBottom: 8 }}>
                        <input
                            type="checkbox"
                            checked={areaVisibility.Places}
                            onChange={() => handleAreaCheckbox("Places")}
                        />{" "}
                        City Limits
                    </label>
                </div>
            </div>
        </div>
    );
}

export default LayerPanel;