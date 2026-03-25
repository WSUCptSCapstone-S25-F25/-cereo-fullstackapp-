import React, { useEffect, useState, useRef } from 'react';
import './Content2.css';
import './Sidebars.css';
import Card from './Card.js';
import FormModal from './FormModal';
import CategoryDropdown from './CategoryDropdown';
import SortDropdown from './SortDropdown';
import axios from 'axios';
import { showAll, filterCategory, filterTag, filterCategoryAndTag } from "./Filter.js";
import { curLocationCoordinates, searchLocationCoordinates } from './Content1.js';
import api from './api.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleLeft, faAngleDoubleRight, faStar, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';

function Content2(props) {
    const { setCardPanelWidth } = props;
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const containerWidth = props.cardPanelWidth ?? 300;
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const startWidth = useRef(500);
    const cardContainerRef = useRef(null);
    const lastHandledSidebarSearchRequestRef = useRef(0);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    function useDidMount() {
        const mountRef = useRef(false);
        useEffect(() => { mountRef.current = true }, []);
        return () => mountRef.current;
    }

    const didMount = useDidMount();
    const didMountRef = useRef(false);

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
            setCardPanelWidth?.(newWidth);
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
    }, [isDragging, setCardPanelWidth]);

    const location = useLocation();
    const resolvedUsername = props.username || location.state?.username || localStorage.getItem("username");

    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [cardSearchKeyword, setCardSearchKeyword] = useState(props.searchCondition || '');
    const [cardTypeFilter, setCardTypeFilter] = useState(props.CategoryCondition || '');
    const [sortMode, setSortMode] = useState((props.sortCondition || '').split(',')[0] || '');
    const [showOnlyInView, setShowOnlyInView] = useState(false);
    const [learnMoreRequest, setLearnMoreRequest] = useState(null);
    const selectedCardIdFromMap = props.selectedCardIdFromMap != null
        ? String(props.selectedCardIdFromMap)
        : null;

    const handleFavoritesToggle = () => {
        if (!props.isLoggedIn) {
            alert("Please log in first.");
            return;
        }
        setShowFavoritesOnly(prev => !prev);
    };

    const toggleViewScope = () => {
        setShowOnlyInView(prev => !prev);
    };

    const notifyCardsLoaded = (cardCount) => {
        window.dispatchEvent(new CustomEvent('atlas:cards-loaded', {
            detail: { cardCount }
        }));
    };

    const handleCardSearch = () => {
        props.setSearchTriggerSource?.('container-panel');
        props.setSearchCondition?.(cardSearchKeyword.trim().toLowerCase());
        props.setCategoryConditionCondition?.(cardTypeFilter);
    };

    const handleCardSearchClear = () => {
        props.setSearchTriggerSource?.('container-panel');
        setCardSearchKeyword('');
        setCardTypeFilter('');
        props.setSearchCondition?.('');
        props.setCategoryConditionCondition?.('');
    };

    const handleSortModeChange = (nextSortMode) => {

        if (!nextSortMode) {
            setSortMode('');
            props.setSortCondition?.('');
            return;
        }

        if (nextSortMode === 'ClosestToMe') {
            const { lat, lng } = curLocationCoordinates;
            if (!lat && !lng) {
                alert('Please turn on your current location to use this sorting method.');
                return;
            }
            setSortMode(nextSortMode);
            props.setSortCondition?.(`${nextSortMode},${lat},${lng}`);
            return;
        }

        if (nextSortMode === 'ClosestToPin') {
            const { lat, lng } = searchLocationCoordinates;
            if (!lat && !lng) {
                alert('Please search a location on the map first to use this sorting method.');
                return;
            }
            setSortMode(nextSortMode);
            props.setSortCondition?.(`${nextSortMode},${lat},${lng}`);
            return;
        }

        setSortMode(nextSortMode);
        props.setSortCondition?.(nextSortMode);
    };

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
                    console.log('[Content2] /allCards response:', cardData.length, 'cards');
                    
                    // Deduplicate by cardID
                    const uniqueCards = cardData.filter((card, index, self) => 
                        index === self.findIndex(c => c.cardID === card.cardID)
                    );
                    // console.log('[Content2] After deduplication:', uniqueCards.length, 'unique cards');
                    // console.table(uniqueCards);
                    setCards(uniqueCards);
                    notifyCardsLoaded(uniqueCards.length);
                })
                .catch(error => console.error(error));
            return;
        }

        // Always fetch filtered/sorted cards from the server
        showAll();
        api.get('/allCardsByTag', { params })
            .then(response => {
                const cardData = response.data?.data || [];
                
                // Deduplicate by cardID
                const uniqueCards = cardData.filter((card, index, self) => 
                    index === self.findIndex(c => c.cardID === card.cardID)
                );
                // console.log('[Content2] /allCardsByTag:', uniqueCards.length, 'unique cards from', cardData.length);
                // console.table(uniqueCards);
                setCards(uniqueCards);
                notifyCardsLoaded(uniqueCards.length);
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
            setShowFavoritesOnly(false);
        }
    }, [resolvedUsername]);

    useEffect(() => {
        setCardSearchKeyword(props.searchCondition || '');
    }, [props.searchCondition]);

    useEffect(() => {
        setCardTypeFilter(props.CategoryCondition || '');
    }, [props.CategoryCondition]);

    useEffect(() => {
        setSortMode((props.sortCondition || '').split(',')[0] || '');
    }, [props.sortCondition]);

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
                        const cardData = response.data.data;
                        
                        // Deduplicate by cardID
                        const uniqueCards = cardData.filter((card, index, self) => 
                            index === self.findIndex(c => c.cardID === card.cardID)
                        );
                        // console.log('[Content2] Search results:', uniqueCards.length, 'unique cards from', cardData.length);
                        setCards(uniqueCards);
                        notifyCardsLoaded(uniqueCards.length);

                        const isNewSidebarSearchRequest =
                            props.searchTriggerSource === 'sidebar-mini' &&
                            props.sidebarSearchRequestId > lastHandledSidebarSearchRequestRef.current;

                        if (isNewSidebarSearchRequest) {
                            const firstCardWithCoords = uniqueCards.find(card => {
                                const latitude = Number(card.latitude);
                                const longitude = Number(card.longitude);
                                return Number.isFinite(latitude) && Number.isFinite(longitude);
                            });

                            if (firstCardWithCoords) {
                                handleCardClick(firstCardWithCoords);
                            }

                            lastHandledSidebarSearchRequestRef.current = props.sidebarSearchRequestId;
                        }
                    } else {
                        console.warn("No card data returned from searchBar:", response.data);
                        setCards([]);
                    }

                    props.setSearchTriggerSource?.('');
                })
                .catch(error => {
                    console.error(error);
                    props.setSearchTriggerSource?.('');
                });
        }
        else {
            console.log("Not running search" + props.searchCondition);
            loadCardsByCriteria();
            props.setSearchTriggerSource?.('');
        }
    }, [props.searchCondition, props.sidebarSearchRequestId]);

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
        // Keep search results stable while dragging map viewport.
        if (props.searchCondition) return;
        loadCardsByCriteria();
    }, [props.boundCondition, props.searchCondition]);

    const handleCardClick = (card) => {
        console.log('[Content2] Card clicked:', card);
        const latitude = Number(card.latitude);
        const longitude = Number(card.longitude);

        if (props.onCardClick && Number.isFinite(latitude) && Number.isFinite(longitude)) {
            console.log('[Content2] Calling onCardClick with:', {
                latitude,
                longitude
            });
            props.onCardClick({
                latitude,
                longitude
            });
        } else {
            console.warn('[Content2] Card missing lat/lng or onCardClick not provided:', card);
        }
    };

    // Viewport filter for cards based on current map bounds 
    // First deduplicate the cards array to prevent any duplicates
    const uniqueCards = cards.filter((card, index, self) => 
        index === self.findIndex(c => c.cardID === card.cardID)
    );
    
    const isViewportFilteringActive = showOnlyInView && !props.searchCondition;

    const cardsInView = uniqueCards.filter((card) => {
        // During active search or all-cards mode, do not clip by viewport.
        if (!isViewportFilteringActive) {
            return true;
        }

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

    const cardsInViewByType = cardsInView.filter((card) => {
        if (!props.CategoryCondition) return true;
        return card.category === props.CategoryCondition;
    });

    const scopeSubtitle = isViewportFilteringActive ? 'in view' : 'all cards';
    const scopeButtonLabel = isViewportFilteringActive ? 'View: In View' : 'View: All Cards';
    const scopeButtonTitle = isViewportFilteringActive
        ? 'Currently showing cards inside the map viewport. Click to show all cards.'
        : 'Currently showing all cards. Click to show only cards in the map viewport.';

    const displayedCards = cardsInViewByType.filter(
        card => !showFavoritesOnly || bookmarkedCardIDs.has(card.cardID)
    );

    const prioritizedDisplayedCards = (() => {
        if (!selectedCardIdFromMap || props.isCollapsed) {
            return displayedCards;
        }

        const selectedCards = displayedCards.filter(card => String(card.cardID) === selectedCardIdFromMap);
        if (selectedCards.length === 0) {
            return displayedCards;
        }

        const nonSelectedCards = displayedCards.filter(card => String(card.cardID) !== selectedCardIdFromMap);
        return [...selectedCards, ...nonSelectedCards];
    })();

    useEffect(() => {
        if (!props.isCollapsed && selectedCardIdFromMap && cardContainerRef.current) {
            cardContainerRef.current.scrollTop = 0;
        }
    }, [props.isCollapsed, selectedCardIdFromMap]);

    useEffect(() => {
        if (cardContainerRef.current) {
            cardContainerRef.current.scrollTop = 0;
        }
    }, [props.searchCondition]);

    useEffect(() => {
        const handleOpenLearnMoreFromMapPin = (event) => {
            const cardID = event?.detail?.cardID;
            if (cardID == null) return;

            props.setIsCollapsed?.(false);
            if (cardContainerRef.current) {
                cardContainerRef.current.scrollTop = 0;
            }
            setLearnMoreRequest({
                cardID: String(cardID),
                token: Date.now()
            });
        };

        window.addEventListener('atlas:open-card-learn-more', handleOpenLearnMoreFromMapPin);
        return () => {
            window.removeEventListener('atlas:open-card-learn-more', handleOpenLearnMoreFromMapPin);
        };
    }, [props.setIsCollapsed]);

    useEffect(() => {
        if (!learnMoreRequest) return;

        // Keep force-open signal short-lived so it cannot be replayed on later rerenders.
        const timeoutId = window.setTimeout(() => {
            setLearnMoreRequest(null);
        }, 600);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [learnMoreRequest]);

    useEffect(() => {
        // Clicking/selecting a different map pin should never reuse an older learn-more signal.
        setLearnMoreRequest(null);
    }, [selectedCardIdFromMap]);

    // Log for debugging
    if (cards.length !== uniqueCards.length) {
        // console.warn('[Content2] Found duplicates in cards state!', cards.length, 'total,', uniqueCards.length, 'unique');
        // const duplicateCardIDs = cards.map(c => c.cardID).filter((id, index, self) => self.indexOf(id) !== index);
        // console.warn('[Content2] Duplicate CardIDs:', [...new Set(duplicateCardIDs)]);
    }
    // console.log('[Content2] cardsInView:', cardsInView.length, 'cards from', uniqueCards.length, 'unique cards (', cards.length, 'total)');

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

                <div className="card-panel-top">
                    <div className="card-panel-toolbar">
                        <div className="card-panel-toolbar-title">
                            <span className="card-panel-title">Cards</span>
                            <span className="card-panel-subtitle">{cardsInViewByType.length} {scopeSubtitle}</span>
                        </div>

                        <div className="card-panel-toolbar-actions">
                            <SortDropdown
                                value={sortMode}
                                onChange={handleSortModeChange}
                            />

                            <button
                                type="button"
                                className={`card-toolbar-button ${showFavoritesOnly ? 'active' : ''}`}
                                onClick={handleFavoritesToggle}
                                title={props.isLoggedIn ? 'Show only favorited cards' : 'Log in to use favorites filter'}
                            >
                                <FontAwesomeIcon icon={faStar} />
                                <span>{showFavoritesOnly ? 'Favorites On' : 'Show Favorites'}</span>
                            </button>

                            <button
                                type="button"
                                className={`card-toolbar-button card-toolbar-button--scope ${isViewportFilteringActive ? 'in-view' : 'all-cards'}`}
                                onClick={toggleViewScope}
                                title={scopeButtonTitle}
                            >
                                {scopeButtonLabel}
                            </button>
                        </div>
                    </div>

                    <div className="card-panel-searchbar">
                        <input
                            type="text"
                            value={cardSearchKeyword}
                            onChange={(e) => setCardSearchKeyword(e.target.value)}
                            placeholder="Search cards..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleCardSearch();
                                }
                            }}
                        />

                        <CategoryDropdown
                            value={cardTypeFilter}
                            onChange={(newValue) => {
                                setCardTypeFilter(newValue);
                                // Automatically apply filter when selection changes
                                props.setCategoryConditionCondition?.(newValue);
                            }}
                        />

                        <button
                            className="card-panel-searchbar-btn search"
                            title="Search"
                            onClick={handleCardSearch}
                        >
                            <FontAwesomeIcon icon={faSearch} />
                        </button>

                        <button
                            className="card-panel-searchbar-btn clear"
                            title="Clear Search"
                            onClick={handleCardSearchClear}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>


                {(!props.isLoggedIn || bookmarksLoaded) ? (
                    <div
                        className="card-container"
                        ref={cardContainerRef}
                        style={{ display: props.isCollapsed ? 'none' : 'grid' }}
                    >
                        {(() => {
                            console.log('[Content2] Rendering cards:', prioritizedDisplayedCards.map(c => ({ cardID: c.cardID, title: c.title })));
                            return prioritizedDisplayedCards.map((card, index) => (
                                <div key={`card-${card.cardID}-${index}`} onClick={() => handleCardClick(card)}>
                                    <Card
                                        formData={{
                                            ...card,
                                            files: card.files || [],
                                            viewerUsername: resolvedUsername,
                                            cardID: card.cardID
                                        }}
                                        forceOpenLearnMoreSignal={
                                            learnMoreRequest && String(card.cardID) === learnMoreRequest.cardID
                                                ? learnMoreRequest.token
                                                : null
                                        }
                                        isSelectedFromMap={!!selectedCardIdFromMap && String(card.cardID) === selectedCardIdFromMap}
                                        isFavorited={bookmarkedCardIDs.has(card.cardID)}
                                        username={resolvedUsername}
                                        fetchBookmarks={fetchBookmarks}
                                        isLoggedIn={props.isLoggedIn}
                                        onZoom={() => handleCardClick(card)}   // pass zoom handler down
                                    />
                                </div>
                            ));
                        })()}
                    </div>
                ) : (
                    <p className="card-container-loading">Loading Cards...</p>
                )}
            </section>
        </>
    );
}

export default Content2;
