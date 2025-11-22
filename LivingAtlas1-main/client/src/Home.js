import React, { useState, useEffect } from 'react';
import Header from './Header';
import Main from './Main';
import Content2 from './Content2';
import Content1 from './Content1';
import LayerPanel from './LayerPanel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faAngleDoubleLeft, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';
import { faUpload, faEarthAmericas } from '@fortawesome/free-solid-svg-icons'; // faEarthAmericas
import './Home.css';
import './Sidebars.css';
import './LayerPanel.css';
import ArcgisUploadPanel from './ArcgisUploadPanel';
import RemovedServicesPanel from './RemovedServicesPanel'; // Import the new panel
import { applyAreaVisibility } from './AreaFilter';
import { showAll } from "./Filter.js";
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons'; // layer group icon
import { faTrash } from '@fortawesome/free-solid-svg-icons'; // trash icon
import { faRobot, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import FormModal from './FormModal';

function Home(props) {
    const [filterCondition, setFilterCondition] = useState('');
    const [CategoryCondition, setCategoryConditionCondition] = useState('');
    const [searchCondition, setSearchCondition] = useState('');
    const [sortCondition, setSortCondition] = useState('');
    const coordinates = {
        NE: { Lng: -116.5981, Lat: 47.0114 },
        SW: { Lng: -117.7654, Lat: 46.4466 }
    };
    const [boundCondition, setboundCondition] = useState(coordinates);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
    const [isRemovedPanelOpen, setIsRemovedPanelOpen] = useState(false); // State for removed panel
    const [isModalOpen, setIsModalOpen] = useState(false); // <-- new state
    const [folderExpanded, setFolderExpanded] = useState(false);
    const [itemExpanded, setItemExpanded] = useState(false);
    const [arcgisLayers, setArcgisLayers] = useState([]);
    const [arcgisLegend, setArcgisLegend] = useState(null);
    const [arcgisLayerAdded, setArcgisLayerAdded] = useState(false);
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);

    // Fetch layers and legend for demo folder/item
    useEffect(() => {
        if (isUploadPanelOpen) {
            const SERVICE_URL = "https://gis.ecology.wa.gov/serverext/rest/services/Authoritative/AQ/MapServer";
            fetch(`${SERVICE_URL}/layers?f=json`)
                .then(res => res.json())
                .then(data => {
                    setArcgisLayers(prevLayers => {
                        if (JSON.stringify(prevLayers) !== JSON.stringify(data.layers || [])) {
                            setCheckedArcgisLayerIds([]);
                        }
                        return data.layers || [];
                    });
                });
            fetch(`${SERVICE_URL}/legend?f=json`)
                .then(res => res.json())
                .then(data => setArcgisLegend(data));
        }
    }, [isUploadPanelOpen]);

    const [selectedCardCoords, setSelectedCardCoords] = useState(null);

    const handleCardClick = (coords) => {
        console.log('[Home] handleCardClick received coords:', coords);
        setSelectedCardCoords(coords);
    };

    /*
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    */

    const toggleSearchModal = () => {
        setIsSearchModalOpen(!isSearchModalOpen);
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const getMapboxMap = () => window.atlasMapInstance;

    const addArcgisLayer = (layerIds = checkedArcgisLayerIds) => {
        const map = window.atlasMapInstance;
        if (!map) return;

        if (map.getLayer('arcgis-raster-layer')) map.removeLayer('arcgis-raster-layer');
        if (map.getSource('arcgis-raster')) map.removeSource('arcgis-raster');

        let layersParam = '';
        if (layerIds.length > 0) {
            layersParam = '&layers=show:' + layerIds.join(',');
        }

        map.addSource('arcgis-raster', {
            type: 'raster',
            tiles: [
                `https://gis.ecology.wa.gov/serverext/rest/services/Authoritative/AQ/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&transparent=true&f=image${layersParam}`
            ],
            tileSize: 256,
            minzoom: 6,
            maxzoom: 12
        });
        map.addLayer({
            id: 'arcgis-raster-layer',
            type: 'raster',
            source: 'arcgis-raster',
            paint: {
                'raster-opacity': 0.35
            }
        });
        setArcgisLayerAdded(true);
    };

    const removeArcgisLayer = () => {
        const map = window.atlasMapInstance;
        if (!map) return;
        if (map.getLayer('arcgis-raster-layer')) map.removeLayer('arcgis-raster-layer');
        if (map.getSource('arcgis-raster')) map.removeSource('arcgis-raster');
        setArcgisLayerAdded(false);
    };

    const [checkedArcgisLayerIds, setCheckedArcgisLayerIds] = useState([]);

    const handleLayerCheckbox = (layerId) => {
        let newChecked;
        if (checkedArcgisLayerIds.includes(layerId)) {
            newChecked = checkedArcgisLayerIds.filter(id => id !== layerId);
        } else {
            newChecked = [...checkedArcgisLayerIds, layerId];
        }
        setCheckedArcgisLayerIds(newChecked);
        if (arcgisLayerAdded) {
            addArcgisLayer(newChecked);
        }
    };

    const handleSelectAll = () => {
        if (checkedArcgisLayerIds.length === arcgisLayers.length) {
            setCheckedArcgisLayerIds([]);
            if (arcgisLayerAdded) removeArcgisLayer();
        } else {
            const allIds = arcgisLayers.map(l => l.id);
            setCheckedArcgisLayerIds(allIds);
            if (arcgisLayerAdded) addArcgisLayer(allIds);
        }
    };

    useEffect(() => {
        if (checkedArcgisLayerIds.length === 0) {
            if (arcgisLayerAdded) removeArcgisLayer();
        } else {
            if (!arcgisLayerAdded) {
                addArcgisLayer(checkedArcgisLayerIds);
            } else {
                addArcgisLayer(checkedArcgisLayerIds);
            }
        }
        // eslint-disable-next-line
    }, [checkedArcgisLayerIds]);

    // Card marker visibility state
    const [layerVisibility, setLayerVisibility] = useState({
        River: true,
        Watershed: true,
        Places: true,
    });

    // Colored area (vector tile) visibility state
    const [areaVisibility, setAreaVisibility] = useState({
        River: true,
        Watershed: true,
        Places: true,
    });

    // Helper to show/hide markers by class
    const updateLayerVisibility = (visibility) => {
        // Rivers
        const rivers = document.getElementsByClassName("blue-marker");
        for (let i = 0; i < rivers.length; i++) {
            rivers[i].style.visibility = visibility.River ? "visible" : "hidden";
        }
        // Watersheds
        const watersheds = document.getElementsByClassName("green-marker");
        for (let i = 0; i < watersheds.length; i++) {
            watersheds[i].style.visibility = visibility.Watershed ? "visible" : "hidden";
        }
        // Places
        const places = document.getElementsByClassName("yellow-marker");
        for (let i = 0; i < places.length; i++) {
            places[i].style.visibility = visibility.Places ? "visible" : "hidden";
        }
    };

    // Show/hide colored areas (vector tile layers)
    useEffect(() => {
        applyAreaVisibility(areaVisibility);
    }, [areaVisibility]);

    // Update marker visibility when checkboxes change
    useEffect(() => {
        // If all are checked, show all
        if (layerVisibility.River && layerVisibility.Watershed && layerVisibility.Places) {
            showAll();
        } else {
            updateLayerVisibility(layerVisibility);
        }
    }, [layerVisibility]);

    // Checkbox handlers
    const handleCategoryLayerCheckbox = (category) => {
        setLayerVisibility((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    const handleAreaCheckbox = (category) => {
        setAreaVisibility((prev) => ({
            ...prev,
            [category]: !prev[category],
        }));
    };

    return (
        <div className="home-container">
            <div className={`left-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                {/* Left Sidebar Search Button */}
                <button className="left-sidebar-search-button" onClick={toggleSearchModal}>
                    <FontAwesomeIcon icon={faSearch} />
                </button>
                {/* GIS Services Button */}
                <button
                    className="left-sidebar-gis-button"
                    onClick={() => {
                        setIsUploadPanelOpen(v => !v);
                        setIsRemovedPanelOpen(false); // Close removed services panel
                    }}
                    title="Browse GIS Services"
                >
                    <FontAwesomeIcon icon={faEarthAmericas} />
                </button>
                {/* Upload Button */}
                <button
                    className="left-sidebar-upload-button"
                    title="Upload Card"
                    onClick={() => setIsModalOpen(v => !v)}   // <-- hook in modal
                >
                    <FontAwesomeIcon icon={faUpload} />
                </button>
                {/* Upload Panel */}
                <ArcgisUploadPanel
                    isOpen={isUploadPanelOpen}
                    onClose={() => setIsUploadPanelOpen(false)}
                    mapInstance={getMapboxMap}
                    arcgisLayerAdded={arcgisLayerAdded}
                    setArcgisLayerAdded={setArcgisLayerAdded}
                    isAdmin={props.isAdmin}
                />
                {/* Left Sidebar toggle Button */}
                {/*
                <button className="left-sidebar-toggle" onClick={toggleSidebar}>
                    <FontAwesomeIcon icon={isSidebarOpen ? faAngleDoubleLeft : faAngleDoubleRight} />
                </button>
                */}
                {/* Layers Button */}
                <button
                    className="left-sidebar-layers-button"
                    onClick={() => setIsLayerPanelOpen((prev) => !prev)}
                    title="Toggle Layers"
                >
                    <FontAwesomeIcon icon={faLayerGroup} />
                </button>
                {/* Trash button - only visible to admins */}
                {props.isAdmin && (
                    <button
                        className="left-sidebar-trash-button"
                        title="Removed Services"
                        onClick={() => {
                            setIsRemovedPanelOpen(v => !v); // Toggle removed panel
                            setIsUploadPanelOpen(false); // Close upload panel
                        }}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                )}
                {/* AI Helper button*/}
                <button
                    className="left-sidebar-ai-button"
                    title="AI Helper"
                    onClick={() => {/* AI Helper logic will go here */}}
                >
                    <FontAwesomeIcon icon={faRobot} />
                </button>

                {/* Removed Services Panel */}
                <RemovedServicesPanel
                    isOpen={isRemovedPanelOpen}
                    onClose={() => setIsRemovedPanelOpen(false)}
                    isAdmin={props.isAdmin}
                />

                {/* Spacer to push tutorial button to bottom */}
                <div className="left-sidebar-spacer"></div>
                
                {/* Tutorial button at the bottom */}
                <button
                    className="left-sidebar-tutorial-button"
                    title="Tutorial"
                    onClick={() => {/* Tutorial logic will go here */}}
                >
                    <FontAwesomeIcon icon={faQuestionCircle} />
                </button>

                {/* Expanded Left Sidebar Content */}
                {isSidebarOpen && (
                    <div className="left-sidebar-content">
                        <Header
                            isLoggedIn={props.isLoggedIn}
                            filterCondition={filterCondition}
                            setFilterCondition={setFilterCondition}
                            searchCondition={searchCondition}
                            setSearchCondition={setSearchCondition}
                            sortCondition={sortCondition}
                            setSortCondition={setSortCondition}
                            CategoryCondition={CategoryCondition}
                            setCategoryConditionCondition={setCategoryConditionCondition}
                            email={props.email}
                            username={props.username}
                            isAdmin={props.isAdmin}
                        />
                    </div>
                )}
            </div>

            {/* Search Modal */}
            {isSearchModalOpen && (
                <div className="search-modal">
                    <div className="search-modal-content">
                        <button className="close-modal" onClick={toggleSearchModal}>
                            &times;
                        </button>
                        <Header
                            isLoggedIn={props.isLoggedIn}
                            filterCondition={filterCondition}
                            setFilterCondition={setFilterCondition}
                            searchCondition={searchCondition}
                            setSearchCondition={setSearchCondition}
                            sortCondition={sortCondition}
                            setSortCondition={setSortCondition}
                            CategoryCondition={CategoryCondition}
                            setCategoryConditionCondition={setCategoryConditionCondition}
                            email={props.email}
                            username={props.username}
                            isAdmin={props.isAdmin}
                        />
                    </div>
                </div>
            )}

            {/* Main Map + Right Sidebar */}
            <Main
                filterCondition={filterCondition}
                setFilterCondition={setFilterCondition}
                searchCondition={searchCondition}
                setSearchCondition={setSearchCondition}
                sortCondition={sortCondition}
                setSortCondition={setSortCondition}
                boundCondition={boundCondition}
                setboundCondition={setboundCondition}
                CategoryCondition={CategoryCondition}
                setCategoryConditionCondition={setCategoryConditionCondition}
                isAdmin={props.isAdmin}
                username={props.username}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isSidebarOpen={isSidebarOpen}
                isUploadPanelOpen={isUploadPanelOpen}
                isRemovedPanelOpen={isRemovedPanelOpen}
                isLayerPanelOpen={isLayerPanelOpen}
                isModalOpen={isModalOpen}
                selectedCardCoords={selectedCardCoords}
            />
            <Content2
                filterCondition={filterCondition}
                setFilterCondition={setFilterCondition}
                searchCondition={searchCondition}
                setSearchCondition={setSearchCondition}
                sortCondition={sortCondition}
                setSortCondition={setSortCondition}
                boundCondition={boundCondition}
                setboundCondition={setboundCondition}
                CategoryCondition={CategoryCondition}
                setCategoryConditionCondition={setCategoryConditionCondition}
                username={props.username}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                onCardClick={handleCardClick}
            />

            {/* FormModal for Upload */}
            <FormModal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                username={props.username || localStorage.getItem("username")}
                email={props.email}
            />

            {/* Layer Panel */}
            <LayerPanel
                isOpen={isLayerPanelOpen}
                onClose={() => setIsLayerPanelOpen(false)}
                layerVisibility={layerVisibility}
                areaVisibility={areaVisibility}
                handleLayerCheckbox={handleCategoryLayerCheckbox}
                handleAreaCheckbox={handleAreaCheckbox}
                filterCondition={filterCondition}
                setFilterCondition={setFilterCondition}
                sortCondition={sortCondition}
                setSortCondition={setSortCondition}
                CategoryCondition={CategoryCondition}
                setCategoryCondition={setCategoryConditionCondition}
            />
        </div>
    );
}

export default Home;
