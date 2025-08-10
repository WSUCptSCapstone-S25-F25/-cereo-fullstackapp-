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
import { faStarHalfStroke } from '@fortawesome/free-regular-svg-icons';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

<script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>

function Content2(props) {

    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

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
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

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
                    console.error(response.data.data);
                    console.error();
                    setCards(response.data.data);
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

    useEffect(() => {
        let isMounted = true; // Track whether the component is mounted
        let isfetched = true; // Track whether the component is mounted



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
            didMountRef.current = true;  // set to true after first render
            setTimeout(1000);
        }
        return () => {
            isMounted = false; // Set it to false when the component unmounts
        };
    }, [props.boundCondition]);



    return (
        <>
            {/* <div id="right-sidebar">
                <div className="collapse-toggle" onClick={toggleCollapse}>
                    <FontAwesomeIcon icon={isCollapsed ? faAngleDoubleLeft : faAngleDoubleRight} />
                </div>
            </div> */}

            <div id="right-sidebar">
                <div className="collapse-toggle" onClick={toggleCollapse}>
                    <FontAwesomeIcon icon={isCollapsed ? faAngleDoubleLeft : faAngleDoubleRight} />
                </div>
                <button 
                    className="add-card-button" 
                    onClick={openModal} 
                    title="Add Card"
                >
                    <FontAwesomeIcon icon={faPlus} />
                </button>
            </div>

            <FormModal 
                username={resolvedUsername} 
                email={props.email} 
                isOpen={isModalOpen} 
                onRequestClose={closeModal} 
            />
    
            <section id="content-2" className={isCollapsed ? 'collapsed' : ''}>
                    
                {!isCollapsed && (
                    <div 
                        className={`favorites-toggle-icon ${showFavoritesOnly ? 'active' : ''}`}
                        onClick={() => setShowFavoritesOnly(prev => !prev)}
                        title="Favorites"
                    >
                        <FontAwesomeIcon icon={faStarHalfStroke} />
                    </div>
                )}

                <div className="card-container" style={{ display: isCollapsed ? 'none' : 'grid' }}>
                    {cards
                        .filter(card => !showFavoritesOnly || bookmarkedCardIDs.has(card.cardID))
                        .map((card, index) => (
                            <Card
                                key={`${card.cardID}-${index}`}
                                formData={{
                                    ...card,
                                    cardOwner: card.username,
                                    viewerUsername: resolvedUsername,
                                    cardID: card.cardID
                                }}
                                isFavorited={bookmarkedCardIDs.has(card.cardID)}
                                username={resolvedUsername}
                                fetchBookmarks={fetchBookmarks}
                            />
                        ))}
                </div>
            </section>
        </>
    );

    
}

export default Content2;
