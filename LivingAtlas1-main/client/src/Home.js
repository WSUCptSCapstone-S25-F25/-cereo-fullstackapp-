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
import CustomLayersPanel from './CustomLayersPanel';
import { applyAreaVisibility } from './AreaFilter';
import { showAll } from "./Filter.js";
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { faBell, faMap, faObjectGroup, faInfoCircle, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import BasemapSwitcher from './BasemapSwitcher';
import Modal from 'react-modal';
import ChangelogModal from './ChangelogModal';
import GeneralOnboardingModal from './GeneralOnboardingModal';
import GeneralOnboarding from './OnboardingGeneral';
import { fetchUserPreferences, saveUserPreferences } from './userPreferencesApi';
import ChatbotWidget from './ChatbotWidget';
import {
    readPendingLocalPreferences,
    writePendingLocalPreferences,
    clearPendingLocalPreferences,
    deepMergePreferences,
    hasPreferenceValues,
} from './userPreferencesLocalCache';

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
    const [cardPanelWidth, setCardPanelWidth] = useState(() => {
        // Derive default panel width from the card size formula so it always fits exactly 2 columns.
        // Card width in CSS = 20vw, grid-gap = 16px, padding = 16px × 2 sides = 32px
        // scrollbar-gutter: stable reserves ~17px for scrollbar even when hidden
        // Panel for 2 cols = 2 × (20vw) + 1 × gap + padding + scrollbar_gutter
        const CARD_VW = 0.20;
        const GRID_GAP = 16;
        const GRID_PADDING = 32;
        const SCROLLBAR_GUTTER = 20; // matches scrollbar-gutter:stable reserved width
        const SUBPIXEL_BUFFER = 4;  // absorbs browser subpixel rounding of vw values
        const COLS = 2;
        // Math.ceil avoids being 1px short when Windows display scaling (e.g. 125%) reduces vw
        return Math.max(300, Math.ceil(
            window.innerWidth * CARD_VW * COLS + GRID_GAP * (COLS - 1) + GRID_PADDING + SCROLLBAR_GUTTER + SUBPIXEL_BUFFER
        ));
    });
    const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
    const [arcgisNavigateTarget, setArcgisNavigateTarget] = useState(null);
    const [isCustomLayerPanelOpen, setIsCustomLayerPanelOpen] = useState(false);
    const [customLayersRefreshKey, setCustomLayersRefreshKey] = useState(0);
    const [cardPanelSide, setCardPanelSide] = useState('right');
    const [folderExpanded, setFolderExpanded] = useState(false);
    const [itemExpanded, setItemExpanded] = useState(false);
    const [arcgisLayers, setArcgisLayers] = useState([]);
    const [arcgisLegend, setArcgisLegend] = useState(null);
    const [arcgisLayerAdded, setArcgisLayerAdded] = useState(false);
    const [isChangelogOpen, setIsChangelogOpen] = useState(() => {
        return !localStorage.getItem('changelog_seen_v15');
    });
    const [isGeneralOnboardingOpen, setIsGeneralOnboardingOpen] = useState(false);
    const [isGeneralOnboardingTourOpen, setIsGeneralOnboardingTourOpen] = useState(false);
    const [chatbotDisplayMode, setChatbotDisplayMode] = useState('floating');
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);

    const closeChangelog = () => {
        localStorage.setItem('changelog_seen_v15', 'true');
        setIsChangelogOpen(false);
    };

    const closeGeneralOnboarding = () => {
        setIsGeneralOnboardingOpen(false);
    };

    const startGeneralOnboardingTour = () => {
        setIsGeneralOnboardingOpen(false);
        setIsGeneralOnboardingTourOpen(true);
    };

    const closeGeneralOnboardingTour = () => {
        setIsGeneralOnboardingTourOpen(false);
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

    // Listen for card linked-ArcGIS-item clicks → open panel and navigate
    useEffect(() => {
        const handler = (e) => {
            setIsUploadPanelOpen(true);
            setIsCustomLayerPanelOpen(false);
            setArcgisNavigateTarget(e.detail);
        };
        window.addEventListener('open-arcgis-panel', handler);
        return () => window.removeEventListener('open-arcgis-panel', handler);
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

    const toggleSidebarChatbotPanel = () => {
        if (chatbotDisplayMode === 'floating') return;
        setIsChatbotOpen(prev => !prev);
    };

    const handleChatbotDisplayModeChange = (nextMode) => {
        setChatbotDisplayMode(nextMode);
        setIsChatbotOpen(true);
    };

    const getMapboxMap = () => window.atlasMapInstance;

    // Basemap switcher state
    const [isBasemapOpen, setIsBasemapOpen] = useState(false);
    const [preferredBasemapId, setPreferredBasemapId] = useState('streets-v12');
    const [cardViewModePreference, setCardViewModePreference] = useState('grid');
    const [preferencesLoaded, setPreferencesLoaded] = useState(false);
    const [localPreferencesReady, setLocalPreferencesReady] = useState(false);

    const applyUiPreferences = (preferences) => {
        const uiPrefs = preferences?.ui || {};
        setPreferredBasemapId(
            typeof uiPrefs.basemapId === 'string' && uiPrefs.basemapId.trim()
                ? uiPrefs.basemapId
                : 'streets-v12'
        );
        const newCardViewMode = uiPrefs.cardViewMode === 'list' ? 'list' : 'grid';
        setCardViewModePreference(newCardViewMode);
        if (newCardViewMode === 'list') {
            setCardPanelWidth(Math.round(window.innerWidth * 0.25));
        }
        setCardPanelSide(uiPrefs.cardPanelSide === 'left' ? 'left' : 'right');
        setChatbotDisplayMode(uiPrefs.chatbotDisplayMode === 'sidebar' ? 'sidebar' : 'floating');
    };

    useEffect(() => {
        let cancelled = false;

        const loadPreferences = async () => {
            if (!props.isLoggedIn || !props.email) {
                const localPreferences = readPendingLocalPreferences();
                if (!cancelled && hasPreferenceValues(localPreferences)) {
                    applyUiPreferences(localPreferences);
                }
                if (!cancelled) {
                    setPreferencesLoaded(false);
                    setLocalPreferencesReady(true);
                }
                return;
            }

            if (!cancelled) {
                setPreferencesLoaded(false);
                setLocalPreferencesReady(false);
            }

            try {
                const [cloudPreferences, localPendingPreferences] = await Promise.all([
                    fetchUserPreferences(props.email),
                    Promise.resolve(readPendingLocalPreferences()),
                ]);

                if (cancelled) return;

                const mergedPreferences = deepMergePreferences(cloudPreferences, localPendingPreferences);
                applyUiPreferences(mergedPreferences);

                if (hasPreferenceValues(localPendingPreferences)) {
                    await saveUserPreferences(props.email, mergedPreferences);
                    clearPendingLocalPreferences();
                }
            } catch (error) {
                console.warn('[Home] Failed to load user preferences:', error);
            } finally {
                if (!cancelled) {
                    setPreferencesLoaded(true);
                }
            }
        };

        loadPreferences();

        return () => {
            cancelled = true;
        };
    }, [props.isLoggedIn, props.email]);

    useEffect(() => {
        if (!props.isLoggedIn || !props.email || !preferencesLoaded) {
            return;
        }

        const timer = setTimeout(() => {
            saveUserPreferences(props.email, {
                ui: {
                    basemapId: preferredBasemapId,
                    cardViewMode: cardViewModePreference,
                    cardPanelSide,
                    chatbotDisplayMode,
                },
            }).catch(error => {
                console.warn('[Home] Failed to save user preferences:', error);
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [
        props.isLoggedIn,
        props.email,
        preferencesLoaded,
        preferredBasemapId,
        cardViewModePreference,
        cardPanelSide,
        chatbotDisplayMode,
    ]);

    useEffect(() => {
        if (props.isLoggedIn || !localPreferencesReady) {
            return;
        }

        const timer = setTimeout(() => {
            writePendingLocalPreferences({
                ui: {
                    basemapId: preferredBasemapId,
                    cardViewMode: cardViewModePreference,
                    cardPanelSide,
                    chatbotDisplayMode,
                },
            });
        }, 200);

        return () => clearTimeout(timer);
    }, [
        props.isLoggedIn,
        localPreferencesReady,
        preferredBasemapId,
        cardViewModePreference,
        cardPanelSide,
        chatbotDisplayMode,
    ]);

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
        River: false,
        Watershed: false,
        Places: false,
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
            <div className={`left-sidebar ${isSidebarOpen ? 'open' : ''}`} data-onboarding-target="left-sidebar-root">
                {/* Left Sidebar Search Button */}
                <button className="left-sidebar-search-button" data-onboarding-target="left-sidebar-search" onClick={toggleSearchModal}>
                    <FontAwesomeIcon icon={faSearch} />
                </button>

                {/* Card Container Toggle Button */}
                <button
                    className={`left-sidebar-cards-button${!isCollapsed ? ' active' : ''}`}
                    data-onboarding-target="left-sidebar-cards"
                    onClick={toggleCardContainer}
                    title={isCollapsed ? "Show Cards" : "Hide Cards"}
                >
                    <FontAwesomeIcon icon={faClone} />
                </button>

                {/* GIS Services Button */}
                <button
                    className={`left-sidebar-gis-button${isUploadPanelOpen ? ' active' : ''}`}
                    data-onboarding-target="left-sidebar-gis"
                    onClick={() => { setIsUploadPanelOpen(v => !v); setIsCustomLayerPanelOpen(false); }}
                    title="Toggle Layers"
                >
                    <FontAwesomeIcon icon={faLayerGroup} />
                </button>

                {/* Upload Panel */}
                <ArcgisUploadPanel
                    isOpen={isUploadPanelOpen}
                    onClose={() => setIsUploadPanelOpen(false)}
                    splitBottom={cardPanelSide === 'left' && !isCollapsed}
                    mapInstance={getMapboxMap}
                    arcgisLayerAdded={arcgisLayerAdded}
                    setArcgisLayerAdded={setArcgisLayerAdded}
                    areaVisibility={areaVisibility}
                    handleAreaCheckbox={handleAreaCheckbox}
                    navigateToItem={arcgisNavigateTarget}
                    onNavigateToItemDone={() => setArcgisNavigateTarget(null)}
                    onCustomLayerSaved={() => setCustomLayersRefreshKey(k => k + 1)}
                />

                {/* Custom Layers Button */}
                <button
                    className={`left-sidebar-customlayers-button${isCustomLayerPanelOpen ? ' active' : ''}`}
                    data-onboarding-target="left-sidebar-customlayers"
                    onClick={() => { setIsCustomLayerPanelOpen(v => !v); setIsUploadPanelOpen(false); }}
                    title="Custom Layers"
                >
                    <FontAwesomeIcon icon={faObjectGroup} />
                </button>

                {/* Custom Layers Panel */}
                <CustomLayersPanel
                    isOpen={isCustomLayerPanelOpen}
                    onClose={() => setIsCustomLayerPanelOpen(false)}
                    splitBottom={cardPanelSide === 'left' && !isCollapsed}
                    mapInstance={getMapboxMap}
                    refreshKey={customLayersRefreshKey}
                />

                {/* Basemap Switcher Button */}
                <button
                    className="left-sidebar-basemap-button"
                    data-onboarding-target="left-sidebar-basemap"
                    onClick={() => setIsBasemapOpen(v => !v)}
                    title="Change Basemap"
                >
                    <FontAwesomeIcon icon={faMap} />
                </button>

                <button
                    className={`left-sidebar-chatbot-button${chatbotDisplayMode === 'sidebar' && isChatbotOpen ? ' active' : ''}`}
                    data-onboarding-target="left-sidebar-chatbot"
                    onClick={toggleSidebarChatbotPanel}
                    title={
                        chatbotDisplayMode === 'floating'
                            ? 'Chatbot button disabled in floating mode'
                            : (isChatbotOpen ? 'Close Chatbot' : 'Open Chatbot')
                    }
                    disabled={chatbotDisplayMode === 'floating'}
                >
                    <FontAwesomeIcon icon={faCommentDots} />
                </button>

                {/* Basemap Switcher Panel */}
                <BasemapSwitcher
                    isOpen={isBasemapOpen}
                    onClose={() => setIsBasemapOpen(false)}
                    mapInstance={getMapboxMap}
                    currentBasemapId={preferredBasemapId}
                    onBasemapChange={setPreferredBasemapId}
                />

                {/* Spacer pushes bell to bottom */}
                <div className="left-sidebar-spacer" />

                {/* Changelog Bell Button */}
                <button
                    className="left-sidebar-changelog-button"
                    data-onboarding-target="left-sidebar-changelog"
                    onClick={() => setIsChangelogOpen(true)}
                    title="What's new"
                >
                    <FontAwesomeIcon icon={faBell} />
                </button>

                <button
                    className="left-sidebar-onboarding-button"
                    data-onboarding-target="left-sidebar-general-onboarding"
                    onClick={() => setIsGeneralOnboardingOpen(true)}
                    title="App onboarding"
                >
                    <FontAwesomeIcon icon={faInfoCircle} />
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
                selectedCardCoords={selectedCardCoords}
                onMarkerCardSelect={setSelectedCardIdFromMap}
                cardPanelWidth={cardPanelWidth}
                cardPanelSide={cardPanelSide}
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
                cardPanelSide={cardPanelSide}
                setCardPanelSide={setCardPanelSide}
                initialCardViewMode={cardViewModePreference}
                onCardViewModeChange={setCardViewModePreference}
                isUploadPanelOpen={isUploadPanelOpen}
                onCardClick={handleCardClick}
            />

            {/* Changelog Modal */}
            <ChangelogModal isOpen={isChangelogOpen} onClose={closeChangelog} />

            {/* App General Onboarding Modal */}
            <GeneralOnboardingModal isOpen={isGeneralOnboardingOpen} onClose={closeGeneralOnboarding} onPlay={startGeneralOnboardingTour} />

            {/* App General Onboarding Tour */}
            <GeneralOnboarding isOpen={isGeneralOnboardingTourOpen} onClose={closeGeneralOnboardingTour} />

            {/* AI Chatbot floating widget */}
            <ChatbotWidget
                displayMode={chatbotDisplayMode}
                isOpen={isChatbotOpen}
                onOpenChange={setIsChatbotOpen}
                onDisplayModeChange={handleChatbotDisplayModeChange}
                splitBottom={cardPanelSide === 'left' && !isCollapsed}
            />

        </div>
    );
}

export default Home;
