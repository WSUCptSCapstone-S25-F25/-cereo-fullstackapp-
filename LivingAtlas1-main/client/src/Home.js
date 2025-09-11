import React, { useState, useEffect } from 'react';
import Header from './Header';
import Main from './Main';
import Content2 from './Content2';
import Content1 from './Content1';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faAngleDoubleLeft, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';
import { faUpload, faEarthAmericas } from '@fortawesome/free-solid-svg-icons'; // <-- Add faEarthAmericas
import './Home.css';
import './Sidebars.css';
import ArcgisUploadPanel from './ArcgisUploadPanel';

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
    const [folderExpanded, setFolderExpanded] = useState(false);
    const [itemExpanded, setItemExpanded] = useState(false);
    const [arcgisLayers, setArcgisLayers] = useState([]);
    const [arcgisLegend, setArcgisLegend] = useState(null);
    const [arcgisLayerAdded, setArcgisLayerAdded] = useState(false); // State to track if AQ layer is added

    // Fetch layers and legend for demo folder/item
    useEffect(() => {
        if (isUploadPanelOpen) {
            const SERVICE_URL = "https://gis.ecology.wa.gov/serverext/rest/services/Authoritative/AQ/MapServer";
            fetch(`${SERVICE_URL}/layers?f=json`)
                .then(res => res.json())
                .then(data => {
                    setArcgisLayers(prevLayers => {
                        // Only reset checked layers if the layers list actually changed
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

    // State to track selected card coordinates
    const [selectedCardCoords, setSelectedCardCoords] = useState(null);

    const handleCardClick = (coords) => {
        console.log('[Home] handleCardClick received coords:', coords);
        setSelectedCardCoords(coords);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleSearchModal = () => {
        setIsSearchModalOpen(!isSearchModalOpen);
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    // Helper to access the Mapbox map instance
    const getMapboxMap = () => window.atlasMapInstance;

    // Add AQ Layer
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

    // Remove AQ Layer
    const removeArcgisLayer = () => {
        const map = window.atlasMapInstance;
        if (!map) return;
        if (map.getLayer('arcgis-raster-layer')) map.removeLayer('arcgis-raster-layer');
        if (map.getSource('arcgis-raster')) map.removeSource('arcgis-raster');
        setArcgisLayerAdded(false);
    };

    const [checkedArcgisLayerIds, setCheckedArcgisLayerIds] = useState([]); // IDs of checked layers

    const handleLayerCheckbox = (layerId) => {
        let newChecked;
        if (checkedArcgisLayerIds.includes(layerId)) {
            newChecked = checkedArcgisLayerIds.filter(id => id !== layerId);
        } else {
            newChecked = [...checkedArcgisLayerIds, layerId];
        }
        setCheckedArcgisLayerIds(newChecked);
        if (arcgisLayerAdded) {
            // Update AQ layer on map
            addArcgisLayer(newChecked);
        }
    };

    const handleSelectAll = () => {
        if (checkedArcgisLayerIds.length === arcgisLayers.length) {
            setCheckedArcgisLayerIds([]);
            if (arcgisLayerAdded) removeArcgisLayer(); // Remove the AQ layer if none selected
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

    return (
        <div className="home-container">
            <div className={`left-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                {/* Left Sidebar Search Button */}
                <button className="left-sidebar-search-button" onClick={toggleSearchModal}>
                    <FontAwesomeIcon icon={faSearch} />
                </button>
                {/* GIS Services Button (was Upload Button) */}
                <button
                    className="left-sidebar-gis-button" // <-- Changed class name
                    onClick={() => setIsUploadPanelOpen(v => !v)}
                    title="Browse GIS Services"
                >
                    <FontAwesomeIcon icon={faEarthAmericas} />
                </button>
                {/* New Upload Button */}
                <button
                    className="left-sidebar-upload-button"
                    title="Upload"
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
                />

                {/* Left Sidebar toggle Button */}
                <button className="left-sidebar-toggle" onClick={toggleSidebar}>
                    <FontAwesomeIcon icon={isSidebarOpen ? faAngleDoubleLeft : faAngleDoubleRight} />
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
                        {/* Reuse the Header component */}
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

            {/* Right Sidebar */}
            {/* <div id="right-sidebar">
                <div className="collapse-toggle" onClick={toggleCollapse}>
                    <FontAwesomeIcon icon={isCollapsed ? faAngleDoubleLeft : faAngleDoubleRight} />
                </div>
            </div> */}

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
                onCardClick={handleCardClick}
            />
            {props.isLoggedIn && props.isAdmin}
            {/* {<p>Welcome, admin user!</p>} */}
        </div>
    );
}

export default Home;
