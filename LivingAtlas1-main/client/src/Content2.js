import React, { useEffect, useState, useRef } from 'react';
import './Content2.css';
import './Sidebars.css';
import Card from './Card.js';
import FormModal from './FormModal';
import axios from 'axios';
import { showAll, filterCategory, filterTag, filterCategoryAndTag } from "./Filter.js";
import api from './api.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleLeft, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';

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
    function loadCardsByCriteria() {
        let params = {};

        if (props.CategoryCondition) params.categoryString = props.CategoryCondition;
        if (props.filterCondition) params.tagString = props.filterCondition;
        if (props.sortCondition) params.sortString = props.sortCondition;

        // Show all locally if no filters
        if (!props.CategoryCondition && !props.filterCondition && !props.searchCondition && !props.sortCondition) {
            showAll();
            api.get('/allCards')
                .then(response => {
                    const cardData = response.data?.data || [];
                    console.table(cardData);
                    setCards(cardData);
                })
                .catch(error => console.error(error));
            return;
        }

        // Always fetch filtered/sorted cards from the server
        showAll();
        api.get('/allCardsByTag', { params })
            .then(response => {
                const cardData = response.data?.data || [];
                console.table(cardData);
                setCards(cardData);
            })
            .catch(error => console.error('Error fetching cards by criteria:', error));
        /*
        if (!didMountRef.current) {
            return;
        }
        console.log(props.filterCondition, props.CategoryCondition, props.sortCondition, props.searchCondition);
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
            if (props.filterCondition === '') {
                console.log("running category " + props.CategoryCondition);
                showAll();
                filterCategory(props.CategoryCondition);
                let params = {categoryString: props.CategoryCondition};
                if (props.sortCondition) {
                    params.sortString = props.sortCondition;
                }
                if (props.searchCondition) {
                    params.titleSearch = props.searchCondition
                }

                api.get('/allCardsByTag', {
                    params: params
                })
                    .then(response => {
                        setCards(response.data.data);
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error);
                    });
            } else if (props.CategoryCondition === '') {
                console.log("running filter 196 " + props.filterCondition);
                showAll();
                filterTag(props.filterCondition);
                let params = {tagString: props.filterCondition};
                if (props.sortCondition) {
                    params.sortString = props.sortCondition;
                }
                if (props.searchCondition) {
                    params.titleSearch = props.searchCondition
                }

                api.get('/allCardsByTag', {
                    params: params
                })
                    .then(response => {
                        setCards(response.data.data);
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error);
                    });
            } else if (props.CategoryCondition !== '' && props.filterCondition !== '') {
                showAll();
                filterCategoryAndTag(props.CategoryCondition, props.filterCondition)
                let params = {categoryString: props.CategoryCondition,
                                tagString: props.filterCondition};
                if (props.sortCondition) {
                    params.sortString = props.sortCondition;
                }
                if (props.searchCondition) {
                    params.titleSearch = props.searchCondition
                }

                api.get('/allCardsByTag', {
                    params: params
                })
                    .then(response => {
                        setCards(response.data.data);
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error);
                    });
            } else if (props.sortCondition !== '') {
                showAll();
                let params = {sortString: props.sortCondition};
                if (props.searchCondition) {
                    params.titleSearch = props.searchCondition
                }
                api.get('/allCardsByTag', {
                    params: params
                })
                    .then(response => {
                        setCards(response.data.data);
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', props.sortCondition);
                    });
            } else if (props.searchCondition !== '') {
                api.get('/allCardsByTag', {
                    params: {titleSearch: props.searchCondition}
                })
                    .then(response => {
                        setCards(response.data.data);
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', props.searchCondition);
                    });
            }
        }
        */
    }

    const [cards, setCards] = useState([]);
    const [bookmarkedCardIDs, setBookmarkedCardIDs] = useState(new Set());
    const [bookmarksLoaded, setBookmarksLoaded] = useState(false);   // keeps track of bookmark fetch
    const [filterCondition, setFilterCondition] = useState(props.filterCondition);
    const [searchCondition, setSearchCondition] = useState(props.searchCondition);
    const [sortCondition, setSortCondition] = useState(props.sortCondition);

    useEffect(() => {
        if (resolvedUsername) {
            localStorage.setItem("username", resolvedUsername);
            fetchBookmarks();
        } else {
            // 🔹 NOT LOGGED IN: treat bookmarks as "loaded" with an empty set
            setBookmarkedCardIDs(new Set());
            setBookmarksLoaded(true);
        }
    }, [resolvedUsername]);

    useEffect(() => {
        loadCardsByCriteria();
        /*
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
            console.log("running filter194" + props.filterCondition);
            if (props.filterCondition === '') {
                console.log("running category " + props.CategoryCondition);
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
                        setCards(response.data.data);
                        console.log("Incoming card data:", response.data.data);
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error);
                    });
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
                        setCards(response.data.data);
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error);
                    });
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
                    setCards(response.data.data);
                })
                .catch(error => {
                    console.error('Error fetching cards by tag:', error);
                });
            } else if (props.sortCondition !== '') {
                showAll();
                api.get('/allCardsByTag', {
                    params: {sortString: props.sortCondition}
                })
                    .then(response => {
                        setCards(response.data.data);
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', props.sortCondition);
                    });
            }
        }
        */
    }, [props.filterCondition, props.CategoryCondition, props.sortCondition]);

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
    }, [props.searchCondition]);

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

            console.log("[fetchBookmarks] Raw bookmarked data:", res.data.bookmarkedCards);

            const cardIDs = new Set(
                res.data.bookmarkedCards.map(card =>
                    card.cardID || card.cardid || card.CardID
                )
            );

            setBookmarkedCardIDs(new Set(cardIDs));
            setBookmarksLoaded(true);  //  mark loaded when done
        } catch (error) {
            console.error("[fetchBookmarks] Error fetching bookmarks:", error);
            setBookmarksLoaded(true);  // avoid infinite spinner on error
        }
    };

    // Fetch all cards when boundCondition changes
    const fetchAllCards = async () => {
        try {
            /*
            const response = await api.get('/allCards');
            console.table(response.data.data);
            const fixedResponse = fixBadLoadMap(response.data.data);
            setCards(fixedResponse);
            */
        } catch (error) {
            console.error('Error fetching all cards:', error);
        }
    };

    const fixBadLoadMap = (cards) => cards.map(fixBadLoad);

    const fixBadLoad = (cards) => {
        if (typeof cards.username === "number" && typeof cards.name === "number" && typeof cards.title === "number") {
            return {
                cardID: cards.username,
                latitude: cards.name,
                title: cards.email,
                longitude: cards.title,
                tags: cards.category,
                category: cards.cardID
            };
        }
        return cards;
    }

    useEffect(() => {
        //fetchAllCards();
        loadCardsByCriteria();
    }, [props.boundCondition]);

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

    // Viewport filter for cards based on current map bounds 
    const cardsInView = cards.filter((card) => {
        // If we don't have bounds yet, show everything
        if (!props.boundCondition || !props.boundCondition.NE || !props.boundCondition.SW) {
            return true;
        }

        if (!card.latitude || !card.longitude) {
            return false;
        }

        const lat = Number(card.latitude);
        const lng = Number(card.longitude);

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            return false;
        }

        return (
            lat <= props.boundCondition.NE.Lat &&
            lat >= props.boundCondition.SW.Lat &&
            lng <= props.boundCondition.NE.Lng &&
            lng >= props.boundCondition.SW.Lng
        );
    });

    return (
        <>
            {/* Right Sidebar */}
            <div id="right-sidebar">
                <div className="collapse-toggle" onClick={toggleCollapse}>
                    <FontAwesomeIcon icon={props.isCollapsed ? faAngleDoubleLeft : faAngleDoubleRight} />
                </div>
            </div>

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

                {/* Favorites toggle –  only show when LOGGED IN */}
                {props.isLoggedIn && !props.isCollapsed && (
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


                {(!props.isLoggedIn || bookmarksLoaded) ? (
                    <div className="card-container" style={{ display: props.isCollapsed ? 'none' : 'grid' }}>
                        {cardsInView
                          .filter(card => !showFavoritesOnly || bookmarkedCardIDs.has(card.cardID))
                          .map((card) => (
                            <div key={card.cardID} onClick={() => handleCardClick(card)}>
                                <Card
                                    formData={{
                                        ...card,
                                        files: card.files || [],
                                        viewerUsername: resolvedUsername,
                                        cardID: card.cardID
                                    }}
                                    isFavorited={bookmarkedCardIDs.has(card.cardID)}
                                    username={resolvedUsername}
                                    fetchBookmarks={fetchBookmarks}
                                    isLoggedIn={props.isLoggedIn}
                                    onZoom={() => handleCardClick(card)}   // pass zoom handler down
                                />
                            </div>
                          ))}
                    </div>
                ) : (
                    <p style={{ padding: "20px", textAlign: "center" }}>Loading favorites...</p>
                )}
            </section>
        </>
    );
}

export default Content2;
