import React, { useState, useEffect } from 'react';
import Header from './Header';
import Main from './Main';
import Content2 from './Content2';
import Content1 from './Content1';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faAngleDoubleLeft, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';
import { faUpload, faEarthAmericas } from '@fortawesome/free-solid-svg-icons'; // faEarthAmericas
import './Home.css';
import './Sidebars.css';
import ArcgisUploadPanel from './ArcgisUploadPanel';
import RemovedServicesPanel from './RemovedServicesPanel'; // Import the new panel
import { faTrash } from '@fortawesome/free-solid-svg-icons'; // trash icon
import FormModal from './FormModal'; // <-- import FormModal

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
    const [isFormModalOpen, setIsFormModalOpen] = useState(false); // <-- new state
    const [folderExpanded, setFolderExpanded] = useState(false);
    const [itemExpanded, setItemExpanded] = useState(false);
    const [arcgisLayers, setArcgisLayers] = useState([]);
    const [arcgisLegend, setArcgisLegend] = useState(null);
    const [arcgisLayerAdded, setArcgisLayerAdded] = useState(false);

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

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

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
                    onClick={() => setIsUploadPanelOpen(v => !v)}
                    title="Browse GIS Services"
                >
                    <FontAwesomeIcon icon={faEarthAmericas} />
                </button>
                {/* Upload Button */}
                <button
                    className="left-sidebar-upload-button"
                    title="Upload Card"
                    onClick={() => setIsFormModalOpen(true)}   // <-- hook in modal
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

                {/* Trash button*/}
                <button
                    className="left-sidebar-upload-button"
                    title="Removed Services"
                    style={{ top: '150px', position: 'absolute' }}
                    onClick={() => setIsRemovedPanelOpen(v => !v)} // Toggle removed panel
                >
                    <FontAwesomeIcon icon={faTrash} />
                </button>

                {/* Removed Services Panel */}
                <RemovedServicesPanel
                    isOpen={isRemovedPanelOpen}
                    onClose={() => setIsRemovedPanelOpen(false)}
                />

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
                isOpen={isFormModalOpen}
                onRequestClose={() => setIsFormModalOpen(false)}
                username={props.username}
                email={props.email}
            />
        </div>
    );
}

export default Home;
