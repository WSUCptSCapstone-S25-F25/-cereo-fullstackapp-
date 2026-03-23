import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Main from './Main';
import Content2 from './Content2';
import Content1 from './Content1';
import LayerPanel from './LayerPanel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faAngleDoubleLeft, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';
import { faUpload, faEarthAmericas, faClone } from '@fortawesome/free-solid-svg-icons';
import './Home.css';
import './Sidebars.css';
import './LayerPanel.css';
import ArcgisUploadPanel from './ArcgisUploadPanel';
import RemovedServicesPanel from './RemovedServicesPanel';
import { applyAreaVisibility } from './AreaFilter';
import { showAll } from "./Filter.js";
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-modal';
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
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [cardPanelWidth, setCardPanelWidth] = useState(300);
    const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
    const [isRemovedPanelOpen, setIsRemovedPanelOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [folderExpanded, setFolderExpanded] = useState(false);
    const [itemExpanded, setItemExpanded] = useState(false);
    const [arcgisLayers, setArcgisLayers] = useState([]);
    const [arcgisLegend, setArcgisLegend] = useState(null);
    const [arcgisLayerAdded, setArcgisLayerAdded] = useState(false);
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
    const [isChangelogOpen, setIsChangelogOpen] = useState(() => {
        return !localStorage.getItem('changelog_seen_v1');
    });

    const closeChangelog = () => {
        localStorage.setItem('changelog_seen_v1', 'true');
        setIsChangelogOpen(false);
    };

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const previousOverscrollBehaviorY = document.body.style.overscrollBehaviorY;

        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehaviorY = 'none';

        return () => {
            document.body.style.overflow = previousOverflow;
            document.body.style.overscrollBehaviorY = previousOverscrollBehaviorY;
        };
    }, []);

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
    const [selectedCardIdFromMap, setSelectedCardIdFromMap] = useState(null);
    const [searchTriggerSource, setSearchTriggerSource] = useState('');
    const [sidebarSearchRequestId, setSidebarSearchRequestId] = useState(0);

    const [miniSearchTerm, setMiniSearchTerm] = useState('');
    const miniSearchInputRef = useRef(null);

    useEffect(() => {
        if (isSearchModalOpen && miniSearchInputRef.current) {
            miniSearchInputRef.current.focus();
        }
    }, [isSearchModalOpen]);

    useEffect(() => {
        setMiniSearchTerm(searchCondition || '');
    }, [searchCondition]);

    const handleMiniSearch = (e) => {
        e.preventDefault();
        const term = miniSearchTerm.trim().toLowerCase();
        setSearchTriggerSource('sidebar-mini');
        setSidebarSearchRequestId(prev => prev + 1);
        setSearchCondition(term);
        setIsCollapsed(false);
    };

    const handleCardClick = (coords) => {
        console.log('[Home] handleCardClick received coords:', coords);
        setSelectedCardCoords(coords);
    };

    const toggleSearchModal = () => {
        setIsSearchModalOpen(!isSearchModalOpen);
    };

    const toggleCardContainer = () => {
        setIsCollapsed(prev => !prev);
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
        const rivers = document.getElementsByClassName("blue-marker");
        for (let i = 0; i < rivers.length; i++) {
            rivers[i].style.visibility = visibility.River ? "visible" : "hidden";
        }
        const watersheds = document.getElementsByClassName("green-marker");
        for (let i = 0; i < watersheds.length; i++) {
            watersheds[i].style.visibility = visibility.Watershed ? "visible" : "hidden";
        }
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
        if (layerVisibility.River && layerVisibility.Watershed && layerVisibility.Places) {
            showAll();
        } else {
            updateLayerVisibility(layerVisibility);
        }
    }, [layerVisibility]);

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

                {/* Card Container Toggle Button */}
                <button
                    className="left-sidebar-cards-button"
                    onClick={toggleCardContainer}
                    title={isCollapsed ? "Show Cards" : "Hide Cards"}
                >
                    <FontAwesomeIcon icon={faClone} />
                </button>

                {/* GIS Services Button */}
                <button
                    className="left-sidebar-gis-button"
                    onClick={() => setIsUploadPanelOpen(v => !v)}
                    title="Browse GIS Services"
                >
                    <FontAwesomeIcon icon={faEarthAmericas} />
                </button>

                {/* Upload Button (blocked if not logged in) */}
                <button
                    className="left-sidebar-upload-button"
                    title="Upload Card"
                    onClick={() => {
                        if (!props.isLoggedIn) {
                            alert("Please log in to upload a data card.");
                            return;
                        }
                        setIsModalOpen(true);
                    }}
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

                {/* Layers Button */}
                <button
                    className="left-sidebar-layers-button"
                    onClick={() => setIsLayerPanelOpen((prev) => !prev)}
                    title="Toggle Layers"
                >
                    <FontAwesomeIcon icon={faLayerGroup} />
                </button>

                {/* Trash button*/}
                <button
                    className="left-sidebar-trash-button"
                    title="Removed Services"
                    onClick={() => setIsRemovedPanelOpen(v => !v)}
                >
                    <FontAwesomeIcon icon={faTrash} />
                </button>

                {/* Removed Services Panel */}
                <RemovedServicesPanel
                    isOpen={isRemovedPanelOpen}
                    onClose={() => setIsRemovedPanelOpen(false)}
                />

                {/* Spacer pushes bell to bottom */}
                <div className="left-sidebar-spacer" />

                {/* Changelog Bell Button */}
                <button
                    className="left-sidebar-changelog-button"
                    onClick={() => setIsChangelogOpen(true)}
                    title="What's new"
                >
                    <FontAwesomeIcon icon={faBell} />
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

            {/* Mini Search Modal */}
            <div className={`search-mini-modal${isSearchModalOpen ? ' search-mini-modal--open' : ''}`}>
                <form className="search-mini-form" onSubmit={handleMiniSearch}>
                    <input
                        ref={miniSearchInputRef}
                        type="text"
                        className="search-mini-input"
                        placeholder="Search cards..."
                        value={miniSearchTerm}
                        onChange={e => setMiniSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="search-mini-button">
                        <FontAwesomeIcon icon={faSearch} />
                    </button>
                </form>
            </div>

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
                isLoggedIn={props.isLoggedIn}            /* <-- added */
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isSidebarOpen={isSidebarOpen}
                isUploadPanelOpen={isUploadPanelOpen}
                isRemovedPanelOpen={isRemovedPanelOpen}
                isLayerPanelOpen={isLayerPanelOpen}
                isModalOpen={isModalOpen}
                selectedCardCoords={selectedCardCoords}
                onMarkerCardSelect={setSelectedCardIdFromMap}
                cardPanelWidth={cardPanelWidth}
            />

            <Content2
                filterCondition={filterCondition}
                setFilterCondition={setFilterCondition}
                searchCondition={searchCondition}
                setSearchCondition={setSearchCondition}
                searchTriggerSource={searchTriggerSource}
                setSearchTriggerSource={setSearchTriggerSource}
                sidebarSearchRequestId={sidebarSearchRequestId}
                sortCondition={sortCondition}
                setSortCondition={setSortCondition}
                boundCondition={boundCondition}
                setboundCondition={setboundCondition}
                CategoryCondition={CategoryCondition}
                setCategoryConditionCondition={setCategoryConditionCondition}
                username={props.username}
                isLoggedIn={props.isLoggedIn}             /* <-- added */
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                selectedCardIdFromMap={selectedCardIdFromMap}
                cardPanelWidth={cardPanelWidth}
                setCardPanelWidth={setCardPanelWidth}
                onCardClick={handleCardClick}
            />

            {/* Changelog Modal */}
            <Modal
                isOpen={isChangelogOpen}
                onRequestClose={closeChangelog}
                className="changelog-modal"
                overlayClassName="changelog-modal-overlay"
            >
                <div className="changelog-modal-header">
                    <h2>What's New</h2>
                    <button className="changelog-modal-close" onClick={closeChangelog} aria-label="Close">x</button>
                </div>
                <div className="changelog-modal-body">

                    <h3>Card Interaction</h3>
                    <p>Clicking anywhere on a card now opens the Learn More modal.</p>
                    <p>The Learn More button has been removed from each card.</p>
                    <p>To zoom the map to a card's location, use the small magnifying glass button next to the card title.</p>

                    <h3>Learn More Modal</h3>
                    <p>The modal is now wider and uses more of the screen height.</p>
                    <p>The card image is displayed prominently at the top of the modal.</p>

                    <h3>Card Layout</h3>
                    <p>All cards now have a consistent fixed size. Resizing the card panel no longer changes individual card dimensions.</p>
                    <p>Cards now have a hover effect: a subtle lift, shadow, and border highlight when the cursor moves over them.</p>

                    <h3>Card Visuals</h3>
                    <p>The image area on each card is larger.</p>
                    <p>The title is more compact, and the category is shown beneath it.</p>
                    <p>Clicking a card image opens a full-size preview.</p>

                    <h3>Multi-Image Carousel</h3>
                    <p>Each card now supports multiple images.</p>
                    <p>Left and right arrow buttons (visible on hover) let you navigate between images.</p>
                    <p>Dot indicators at the bottom of the image let you jump to a specific image directly.</p>
                    <p>The same carousel navigation is available in the Learn More modal and the full-size image preview.</p>
                    <p>A database migration was completed to support this: a dedicated CardImages table was created and all 16 existing thumbnail images were migrated with no data loss.</p>

                </div>
                <div className="changelog-modal-footer">
                    <button className="changelog-modal-dismiss" onClick={closeChangelog}>Got it</button>
                </div>
            </Modal>

            {/* FormModal for Upload */}
            <FormModal
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                username={props.username || localStorage.getItem("username")}
                email={props.email}
                isLoggedIn={props.isLoggedIn}             /* <-- extra prop if needed */
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
                setCategoryConditionCondition={setCategoryConditionCondition}
            />
        </div>
    );
}

export default Home;
