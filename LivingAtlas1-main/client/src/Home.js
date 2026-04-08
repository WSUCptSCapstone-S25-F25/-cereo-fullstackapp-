import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Main from './Main';
import Content2 from './Content2';
import Content1 from './Content1';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faAngleDoubleLeft, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';
import { faClone } from '@fortawesome/free-solid-svg-icons';
import './Home.css';
import './Sidebars.css';
import ArcgisUploadPanel from './ArcgisUploadPanel';
import RemovedServicesPanel from './RemovedServicesPanel';
import { applyAreaVisibility } from './AreaFilter';
import { showAll } from "./Filter.js";
import { faLayerGroup, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faBell, faMap } from '@fortawesome/free-solid-svg-icons';
import BasemapSwitcher from './BasemapSwitcher';
import Modal from 'react-modal';

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
    const [cardPanelWidth, setCardPanelWidth] = useState(() => 
        Math.max(300, Math.min(900, Math.floor(window.innerWidth * 0.41)))
    );
    const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
    const [isRemovedPanelOpen, setIsRemovedPanelOpen] = useState(false);
    const [folderExpanded, setFolderExpanded] = useState(false);
    const [itemExpanded, setItemExpanded] = useState(false);
    const [arcgisLayers, setArcgisLayers] = useState([]);
    const [arcgisLegend, setArcgisLegend] = useState(null);
    const [arcgisLayerAdded, setArcgisLayerAdded] = useState(false);
    const [isChangelogOpen, setIsChangelogOpen] = useState(() => {
        return !localStorage.getItem('changelog_seen_v6');
    });

    const closeChangelog = () => {
        localStorage.setItem('changelog_seen_v6', 'true');
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

    // Basemap switcher state
    const [isBasemapOpen, setIsBasemapOpen] = useState(false);

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
                    title="Toggle Layers"
                >
                    <FontAwesomeIcon icon={faLayerGroup} />
                </button>

                {/* Upload Panel */}
                <ArcgisUploadPanel
                    isOpen={isUploadPanelOpen}
                    onClose={() => setIsUploadPanelOpen(false)}
                    mapInstance={getMapboxMap}
                    arcgisLayerAdded={arcgisLayerAdded}
                    setArcgisLayerAdded={setArcgisLayerAdded}
                    areaVisibility={areaVisibility}
                    handleAreaCheckbox={handleAreaCheckbox}
                />

                {/* Basemap Switcher Button */}
                <button
                    className="left-sidebar-basemap-button"
                    onClick={() => setIsBasemapOpen(v => !v)}
                    title="Change Basemap"
                >
                    <FontAwesomeIcon icon={faMap} />
                </button>

                {/* Basemap Switcher Panel */}
                <BasemapSwitcher
                    isOpen={isBasemapOpen}
                    onClose={() => setIsBasemapOpen(false)}
                    mapInstance={getMapboxMap}
                />

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
                    <h3>Update Date: 4/7/2026</h3>
                    <p>Improved layer popup appearance and stacking behavior — when multiple popups are open at the same time, they now stack with visible offsets and distinct border colors so each one stays readable.</p>
                    <p>The "Add Card" form is now accessible directly from the card panel toolbar via the "+" button, instead of a separate page.</p>
                    <p>A "Tags" button was added to the card panel toolbar, allowing you to filter cards by tag right inside the card list.</p>
                    <p>The card upload form now supports adding multiple images and multiple files at once, and includes a "Select Location" button that lets you pick coordinates by clicking on the map. The same feature is also available when editing a card through Learn More.</p>
                    <p>The standalone Layer Panel was removed. Built-in layers (Hydrological Boundaries, City Limits) are now inside the ArcGIS Layers panel's "Built-in Layers" section, and the panel icon was updated.</p>
                    <p>Vector hover overlays now match the zoom range of raster tile layers, so they appear and disappear together as you zoom in and out.</p>

                    <hr />

                    <h3>Update Date: 4/5/2026</h3>
                    <p>Added a new Map Style panel in the left sidebar, so you can switch basemaps directly on the map page.</p>
                    <p>Expanded the basemap list with more options, and each item now uses the exact style id as its label.</p>
                    <p>Hydrological Boundaries and City Limits are now clickable and open a popup with basic attributes.</p>

                    <hr />

                    <h3>Update Date: 4/4/2026</h3>
                    <p>The DB/Local data source toggle was changed from two buttons to a compact switch control in the toolbar.</p>
                    <p>The Update button is now an icon-only square button with a spinning animation while updating.</p>
                    <p>The upload panel is now wider — side and bottom padding were reduced to give more room to the folder area.</p>
                    <p>State folders and folders now highlight on hover for better visual feedback.</p>
                    <p>A new "Pin" feature was added: right-click any service, layer, or sublayer and choose "Pin (Auto-load)" to have it automatically selected every time you open the panel. Pinned selections are saved locally in your browser.</p>
                    <p>The previous database-based selection persistence was temporarily disabled in favor of the new pin system.</p>

                    <hr />

                    <h3>Update Date: 4/3/2026</h3>
                    <p>Added an opacity slider to the ArcGIS Upload Panel toolbar. You can now drag the slider to adjust how transparent all visible map layers are.</p>
                    <p>Fixed a bug where sublayers inside a group layer were incorrectly shown at the same level as their parent. Layers with nested groups now display in the correct hierarchy.</p>

                    <hr />

                    <h3>Update Date: 3/31/2026</h3>
                    <p>Resend email service was integrated with a custom domain (cereo-livingatlas.com) via GoDaddy DNS records.</p>
                    <p>Password recovery and signup notification emails now send from the verified domain with a proper "Living Atlas" sender name.</p>
                    <p>A new Switch Account page was added. Users can view their current account, switch between previously logged-in accounts, or add a new account.</p>
                    <p>The Logout button in the navbar dropdown now properly clears the login session before redirecting to the login page.</p>

                    <hr />

                    <h3>Update Date: 3/28/2026</h3>
                    <p>The ArcGIS Upload Panel now uses a tree-style layout with connector lines and custom square checkboxes, similar to Google Earth's layer panel.</p>
                    <p>Right-click context menus were added on folders, services, and layers — supporting Rename, Learn More, and Delete actions. Rename and Delete require admin login.</p>
                    <p>The service-level checkbox replaces the old Add/Remove buttons, and the "(MapServer)" suffix is now hidden from display names.</p>
                    <p>Top status banners (loading, data source info) were moved to bottom-of-screen notifications that auto-dismiss after a few seconds.</p>
                    <p>The search toolbar now stays pinned at the top of the upload panel while scrolling, and the browser's default right-click menu is blocked inside the panel.</p>

                    <hr />

                    <h3>Update Date: 3/25/2026</h3>
                    <p>See all images now supports reorder controls in edit mode. You can move images up/down, and the saved order is shared across card tiles, Learn More, and map pin popup.</p>
                    <p>Learn More image management was improved with checkbox-based multi-select delete. Delete actions are staged in edit mode and only applied on Save, while Cancel restores the previous state.</p>
                    <p>Card carousel indicators were upgraded for larger image sets: up to 5 dots are shown at once with dynamic sliding, and farther non-neighbor dots use a smaller size for clearer focus.</p>
                    <p>Image display behavior was updated to keep full images visible in fixed-size frames across card thumbnails, Learn More image areas, and map pin popup thumbnails.</p>

                    <hr />

                    <h3>Update Date: 3/24/2026</h3>
                    <p>Learn More is now the main place to manage a card. You can edit, delete, and close from the top bar, and edit fields directly in the modal.</p>
                    <p>Image handling is better: there is a 5-slot gallery, easier add/delete in edit mode, and cancel now rolls back new uploads.</p>
                    <p>Map pin popups are cleaner, show a larger image preview, and can open the matching Learn More card directly.</p>
                    <p>The card panel now uses custom Category and Sort menus, and sort is built into the top toolbar.</p>
                    <p>Image data is now more consistent between card list, Learn More, and map popup, so the same image is shown in more places.</p>

                    <hr />

                    <h3>Update Date: 3/23/2026</h3>
                    <p>Card behavior was simplified: click a card to open Learn More, and use the small zoom icon to locate it on the map.</p>
                    <p>Learn More became larger and easier to read, with more focus on the image area.</p>
                    <p>Card size and styling were unified so the panel looks more consistent.</p>
                    <p>Cards now support multiple images, with carousel browsing in cards, Learn More, and full-size preview.</p>
                    <p>The backend image model was moved to CardImages to support multiple images per card.</p>

                </div>
                <div className="changelog-modal-footer">
                    <button className="changelog-modal-dismiss" onClick={closeChangelog}>Got it</button>
                </div>
            </Modal>

        </div>
    );
}

export default Home;
