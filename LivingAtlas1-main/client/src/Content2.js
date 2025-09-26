import React, { useEffect, useState, useRef } from 'react';
import './Content2.css';
import './Sidebars.css';
import './LayerPanel.css';
import Card from './Card.js';
import FormModal from './FormModal';
import axios from 'axios';
import { showAll, filterCategory, filterTag, filterCategoryAndTag } from "./Filter.js";
import api from './api.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleLeft, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import { faStarHalfStroke } from '@fortawesome/free-regular-svg-icons';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { faBook } from '@fortawesome/free-solid-svg-icons'; // <-- Add this import for the new button icon
import LayerPanel from './LayerPanel';
import { applyAreaVisibility } from './AreaFilter';
import { faCheckSquare } from '@fortawesome/free-solid-svg-icons';

<script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>


function Content2(props) {
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const [containerWidth, setContainerWidth] = useState(300); // Default width in px
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const startWidth = useRef(500);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    function useDidMount() {
        const mountRef = useRef(false);
        useEffect(() => { mountRef.current = true }, []);
        return () => mountRef.current;
    }

    const didMount = useDidMount();
    const didMountRef = useRef(false);

    // Collapse card container
    const [isCollapsed, setIsCollapsed] = useState(true);

    const toggleCollapse = () => {
        props.setIsCollapsed?.(!props.isCollapsed);
    };

    // Drag handlers for resizing
    const onMouseDown = (e) => {
        e.preventDefault(); // Prevent text selection
        setIsDragging(true);
        startX.current = e.clientX;
        startWidth.current = containerWidth;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        if (!isDragging) return;
        const onMouseMove = (e) => {
            const dx = startX.current - e.clientX;
            let newWidth = startWidth.current + dx;
            newWidth = Math.max(250, Math.min(newWidth, 900));
            setContainerWidth(newWidth);
        };
        const onMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging]);

    const location = useLocation();

    const resolvedUsername = props.username || location.state?.username || localStorage.getItem("username");

    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    // Edited by Flavio: same code used to load the cards based on filter. Made it into a function in order to call it under searchConditions being reset to ''
    // That way our team is able to show the cards again once the user closes out of the marker.
    function loadCardsByCriteria() {

        if (!didMountRef.current) {
            return;
        }
        if (props.filterCondition === '' && props.searchCondition === '' && props.CategoryCondition === '' && props.sortCondition === '') {
            console.log("running filter 199" + props.filterCondition);
            showAll();

            api.get('/allCards')

                .then(response => {
                    console.log("Fetched cards:", response.data.data);
                    setCards(response.data.data);
                })
                .catch(error => {
                    console.error(error);
                });
        }
        else {
            // Fetch cards when props.filterCondition changes
            console.log("running filter 197" + props.filterCondition);
            //http://20.252.115.56/allCardsByTag
            //http://localhost:8000/allCardsByTag
            if (props.filterCondition === '') {
                console.log("running category " + props.CategoryCondition);
                // filter markers
                showAll();
                filterCategory(props.CategoryCondition);
                let params = {categoryString: props.CategoryCondition};
                if (props.sortCondition) {
                    params.sortString = props.sortCondition;
                }

                api.get('/allCardsByTag', {
                    params: params
                })
                    .then(response => {
                        setCards(response.data.data); // Update the cards state with the new data
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error); // Log any error that occurs during the fetch
                    });
                //alert("Underconstruction");
            } else if (props.CategoryCondition === '') {
                console.log("running filter 196 " + props.filterCondition);
                showAll();
                filterTag(props.filterCondition);
                let params = {tagString: props.filterCondition};
                if (props.sortCondition) {
                    params.sortString = props.sortCondition;
                }

                api.get('/allCardsByTag', {
                    params: params
                })
                    .then(response => {
                        setCards(response.data.data); // Update the cards state with the new data
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error); // Log any error that occurs during the fetch
                    });
                //alert("Underconstruction");
            } else if (props.CategoryCondition !== '' && props.filterCondition !== '') {
                showAll();
                filterCategoryAndTag(props.CategoryCondition, props.filterCondition)
                let params = {categoryString: props.CategoryCondition,
                                tagString: props.filterCondition};
                if (props.sortCondition) {
                    params.sortString = props.sortCondition;
                }

                api.get('/allCardsByTag', {
                    params: params
                })
                    .then(response => {
                        setCards(response.data.data); // Update the cards state with the new data
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error); // Log any error that occurs during the fetch
                    });
                //alert("Underconstruction");
            } else if (props.sortCondition != '') {
                showAll();
                api.get('/allCardsByTag', {
                    params: {sortString: props.sortCondition}
                })
                    .then(response => {
                        setCards(response.data.data); // Update the cards state with the new data
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', props.sortCondition); // Log any error that occurs during the fetch
                    });
            }
        }
    }

    const [cards, setCards] = useState([]);
    const [bookmarkedCardIDs, setBookmarkedCardIDs] = useState(new Set());
    const [bookmarksLoaded, setBookmarksLoaded] = useState(false);
    const [filterCondition, setFilterCondition] = useState(props.filterCondition);
    const [searchCondition, setSearchCondition] = useState(props.searchCondition);
    const [sortCondition, setSortCondition] = useState(props.sortCondition);
    // const isInitialMount = useRef(true);

    useEffect(() => {
        if (resolvedUsername) {
            localStorage.setItem("username", resolvedUsername);
            fetchBookmarks();
        }
    }, [resolvedUsername]);

    useEffect(() => {

        if (!didMountRef.current) {
            return;
        }

        if (props.filterCondition === '' && props.searchCondition === '' && props.CategoryCondition === '' && props.sortCondition === '') {
            console.log("running filter193" + props.filterCondition);
            showAll();

            api.get('/allCards')

                .then(response => {
                    console.log(response.data.data);
                    setCards(response.data.data);
                })
                .catch(error => {
                    console.error(error);
                });
        }
        else {
            // Fetch cards when props.filterCondition changes
            console.log("running filter194" + props.filterCondition);
            //http://20.252.115.56/allCardsByTag
            //http://localhost:8000/allCardsByTag
            if (props.filterCondition === '') {
                console.log("running category " + props.CategoryCondition);
                // filter markers
                showAll();
                filterCategory(props.CategoryCondition)

                let params = {categoryString: props.CategoryCondition};
                if (props.sortCondition) {
                    params.sortString = props.sortCondition;
                }
                api.get('/allCardsByTag', {
                    params: params
                })
                    .then(response => {
                        setCards(response.data.data); // Update the cards state with the new data
                        console.log("Incoming card data:", response.data.data);
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error); // Log any error that occurs during the fetch
                    });
                //alert("Underconstruction");
            } else if (props.CategoryCondition === '') {
                console.log("running filter 195" + props.filterCondition);
                showAll();
                filterTag(props.filterCondition);

                let params = {tagString: props.filterCondition};
                if (props.sortCondition) {
                    params.sortString = props.sortCondition;
                }

                api.get('/allCardsByTag', {
                    params: params
                })
                    .then(response => {
                        setCards(response.data.data); // Update the cards state with the new data
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error); // Log any error that occurs during the fetch
                    });
                //alert("Underconstruction");
            } else if (props.CategoryCondition !== '' && props.filterCondition !== '') {
                showAll();
                filterCategoryAndTag(props.CategoryCondition, props.filterCondition)

                let params = {categoryString: props.CategoryCondition,
                tagString: props.filterCondition};
                if (props.sortCondition) {
                    params.sortString = props.sortCondition;
                }

                api.get('/allCardsByTag', {
                    params: params
                })
                .then(response => {
                    setCards(response.data.data); // Update the cards state with the new data
                })
                .catch(error => {
                    console.error('Error fetching cards by tag:', error); // Log any error that occurs during the fetch
                });
                //alert("Underconstruction");
            } else if (props.sortCondition !== '') {
                showAll();
                api.get('/allCardsByTag', {
                    params: {sortString: props.sortCondition}
                })
                    .then(response => {
                        setCards(response.data.data); // Update the cards state with the new data
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', props.sortCondition); // Log any error that occurs during the fetch
                    });
            }
        }
    }, [props.filterCondition, props.CategoryCondition, props.sortCondition]); // Only run if props.filterCondition changes

    useEffect(() => {
        if (props.searchCondition != '') {
            console.log("running search" + props.searchCondition);


            api.get('/searchBar', {

                params: {
                    titleSearch: props.searchCondition
                }
            })
                .then(response => {
                    if (Array.isArray(response.data.data)) {
                        setCards(response.data.data);
                        console.log("Search results:", response.data.data);
                    } else {
                        console.warn("No card data returned from searchBar:", response.data);
                        setCards([]);
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }
        else {
            console.log("Not running search" + props.searchCondition);
            loadCardsByCriteria();
        }
    }, [props.searchCondition]); // Only run if props.searchCondition changes

    const fetchBookmarks = async () => {
        console.log("Fetching bookmarks for:", resolvedUsername);

        if (!resolvedUsername) {
            console.warn("[fetchBookmarks] resolvedUsername is null or undefined, skipping API call.");
            return;
        }
        console.log("[fetchBookmarks] Sending GET /getBookmarkedCards request...");

        try {

            await new Promise(r => setTimeout(r, 50));

            const res = await api.get('/getBookmarkedCards', {
                params: { username: resolvedUsername }
            });
    
            console.log("[fetchBookmarks] API call successful. Response:");
            console.log(res);
    
            console.log("[fetchBookmarks] Raw bookmarked data:", res.data.bookmarkedCards);

            const cardIDs = new Set(
                res.data.bookmarkedCards.map(card =>
                    card.cardID || card.cardid || card.CardID
                )
            );
    
            console.log("[fetchBookmarks] Parsed Set of bookmarked IDs:", cardIDs);
    
            setBookmarkedCardIDs(cardIDs);
            setBookmarksLoaded(true);
        } catch (error) {
            console.error("[fetchBookmarks] Error fetching bookmarks:", error);
        }
    };

    // Fetch all cards and update formData instead of using updateBoundry API call
    const fetchAllCards = async () => {
        try {
            const response = await api.get('/allCards');
            setCards(response.data.data);
        } catch (error) {
            console.error('Error fetching all cards:', error);
        }
    };

    useEffect(() => {
        // Commented out updateBoundry logic
        /*
        let isMounted = true;
        let isfetched = true;

        if (didMountRef.current) {
            console.log("running bound" + props.boundCondition);
            const data = {
                "NEpoint": {
                    "lat": props.boundCondition._ne.lat,
                    "long": props.boundCondition._ne.lng
                },
                "SWpoint": {
                    "lat": props.boundCondition._sw.lat,
                    "long": props.boundCondition._sw.lng
                }
            };

            // Define an async function inside useEffect
            const fetchData = async () => {
                try {
                    setTimeout(500);
                    const response = await api.post('/updateBoundry', data);
                    if (isMounted) { // Only update state if the component is still mounted
                        // Check if the first card's title is not a number
                        if (response.data.data.length > 0) {
                            const first = response.data.data[0];
                            if (typeof first.title === 'string' && isNaN(Number(first.title))) {
                                console.log("Incoming card data from updateBoundry:", response.data.data);
                                setCards(response.data.data);
                            } else {
                                console.error('Invalid card data: title is number or invalid:', first);
                            }
                        } else {
                            console.warn('No data returned from updateBoundry:', response.data.data);
                        }
                    }
                } catch (error) {
                    if (isMounted) {
                        console.error('Error:', error);
                    }
                }
            };

            // Call the async function
            fetchData();
            // const timer = setTimeout(() => {
            //     fetchData();
            // }, 1000); // Delay in milliseconds

            // // Clean up the timer when the component unmounts or the dependencies change
            // return () => {
            //     clearTimeout(timer);
            // };


        } else {
            console.log("Not running bound" + props.boundCondition);
            didMountRef.current = true;
            setTimeout(1000);
        }
        return () => {
            isMounted = false;
        };
        */
        // Instead, always fetch all cards when boundCondition changes
        fetchAllCards();
    }, [props.boundCondition]);




    // Handler for card click
    const handleCardClick = (card) => {
        console.log('[Content2] Card clicked:', card);
        if (props.onCardClick && card.latitude && card.longitude) {
            console.log('[Content2] Calling onCardClick with:', {
                latitude: Number(card.latitude),
                longitude: Number(card.longitude)
            });
            props.onCardClick({
                latitude: Number(card.latitude),
                longitude: Number(card.longitude)
            });
        } else {
            console.warn('[Content2] Card missing lat/lng or onCardClick not provided:', card);
        }
    };

    // State for layer panel
    const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);

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
    const handleLayerCheckbox = (category) => {
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
        <>
            {/* Right Sidebar */}
            <div id="right-sidebar">
                <div className="collapse-toggle" onClick={toggleCollapse}>
                    <FontAwesomeIcon icon={props.isCollapsed ? faAngleDoubleLeft : faAngleDoubleRight} />
                </div>
                <button 
                    className="add-card-button" 
                    onClick={openModal} 
                    title="Add Card"
                    style={{ top: '0px', position: 'absolute' }}
                >
                    <FontAwesomeIcon icon={faPlus} />
                </button>
                {/* New Layer Button */}
                <button
                    className="layer-panel-button"
                    onClick={() => setIsLayerPanelOpen((prev) => !prev)}
                    title="Layers"
                    style={{ top: '50px', position: 'absolute' }}
                >
                    <FontAwesomeIcon icon={faLayerGroup} />
                </button>
                {/* New: Open Card Container Button */}
                <button
                    className="open-card-container-button"
                    onClick={toggleCollapse}
                    title={isCollapsed ? "Open Card Container" : "Collapse Card Container"}
                    style={{ top: '100px', position: 'absolute' }}
                >
                    <FontAwesomeIcon icon={faBook} />
                </button>
            </div>

            {/* Layer Panel */}
            <LayerPanel
                isOpen={isLayerPanelOpen}
                onClose={() => setIsLayerPanelOpen(false)}
                layerVisibility={layerVisibility}
                areaVisibility={areaVisibility}
                handleLayerCheckbox={handleLayerCheckbox}
                handleAreaCheckbox={handleAreaCheckbox}
            />

            <FormModal 
                username={resolvedUsername} 
                email={props.email} 
                isOpen={isModalOpen} 
                onRequestClose={closeModal} 
            />
    
            <section
                id="content-2"
                className={props.isCollapsed ? 'collapsed' : ''}
                ref={containerRef}
                style={{ width: containerWidth }}
            >
                {/* Draggable left edge handle */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '6px',
                        height: '100%',
                        cursor: 'ew-resize',
                        zIndex: 1002,
                        background: 'transparent',
                    }}
                    onMouseDown={onMouseDown}
                />

                {/* Favorites toggle checkbox at top-left with spacing */}
                {!props.isCollapsed && (
                    <div 
                        className="favorites-toggle-checkbox"
                        style={{
                            position: 'absolute',
                            top: '18px',
                            left: '18px',
                            zIndex: 10,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#f5f5f5',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={showFavoritesOnly}
                            onChange={() => setShowFavoritesOnly(prev => !prev)}
                            id="favoritesOnlyCheckbox"
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="favoritesOnlyCheckbox" style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', margin: 0 }}>
                            Show Favorites Only
                        </label>
                    </div>
                )}

                <div className="card-container" style={{ display: props.isCollapsed ? 'none' : 'grid' }}>
                    {cards
                        .filter(card => !showFavoritesOnly || bookmarkedCardIDs.has(card.cardID))
                        .map((card, index) => (
                            <div
                                key={`${card.cardID}-${index}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleCardClick(card)} // Always shift view on card click
                            >
                                <Card
                                    formData={{
                                        ...card,
                                        files: card.files || [],   // ensure it's always an array to maintain consistency
                                        cardOwner: card.username,
                                        viewerUsername: resolvedUsername,
                                        cardID: card.cardID
                                    }}
                                    isFavorited={bookmarkedCardIDs.has(card.cardID)}
                                    username={resolvedUsername}
                                    fetchBookmarks={fetchBookmarks}
                                    // No need to pass onLearnMore for fly-to
                                />
                            </div>
                        ))}
                </div>
            </section>
        </>
    );

    
}

export default Content2;
