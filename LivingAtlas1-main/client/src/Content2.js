import React from 'react';
import './Content2.css';
import Card from './Card.js';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { showAll, filterCategory, filterTag, filterCategoryAndTag } from "./Filter.js";
import api from './api.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleLeft, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';

<script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>

function Content2(props) {

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



    // Edited by Flavio: same code used to load the cards based on filter. Made it into a function in order to call it under searchConditions being reset to ''
    // That way our team is able to show the cards again once the user closes out of the marker.
    function loadCardsByCriteria() {

        if (!didMountRef.current) {
            return;
        }
        if (props.filterCondition === '' && props.searchCondition === '' && props.CategoryCondition === '') {
            console.log("running filter 199" + props.filterCondition);
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
            console.log("running filter 197" + props.filterCondition);
            //http://20.252.115.56/allCardsByTag
            //http://localhost:8000/allCardsByTag
            if (props.filterCondition === '') {
                console.log("running category " + props.CategoryCondition);
                // filter markers
                showAll();
                filterCategory(props.CategoryCondition)

                api.get('/allCardsByTag', {

                    params: {
                        categoryString: props.CategoryCondition,
                    }
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

                api.get('/allCardsByTag', {

                    params: {
                        tagString: props.filterCondition
                    }
                })
                    .then(response => {
                        setCards(response.data.data); // Update the cards state with the new data
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error); // Log any error that occurs during the fetch
                    });
                //alert("Underconstruction");
            } else {
                showAll();
                filterCategoryAndTag(props.CategoryCondition, props.filterCondition)

                api.get('/allCardsByTag', {

                    params: {
                        categoryString: props.CategoryCondition,
                        tagString: props.filterCondition
                    }
                })
                    .then(response => {
                        setCards(response.data.data); // Update the cards state with the new data
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error); // Log any error that occurs during the fetch
                    });
                //alert("Underconstruction");
            }
        }
    }

    const [cards, setCards] = useState([]);
    const [bookmarkedTitles, setBookmarkedTitles] = useState(new Set());
    const [filterCondition, setFilterCondition] = useState(props.filterCondition);
    const [searchCondition, setSearchCondition] = useState(props.searchCondition);
    // const isInitialMount = useRef(true);




    useEffect(() => {

        if (!didMountRef.current) {
            return;
        }


        if (props.filterCondition === '' && props.searchCondition === '' && props.CategoryCondition === '') {
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

                api.get('/allCardsByTag', {

                    params: {
                        categoryString: props.CategoryCondition,
                    }
                })
                    .then(response => {
                        setCards(response.data.data); // Update the cards state with the new data
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error); // Log any error that occurs during the fetch
                    });
                //alert("Underconstruction");
            } else if (props.CategoryCondition === '') {
                console.log("running filter 195" + props.filterCondition);
                showAll();
                filterTag(props.filterCondition);

                api.get('/allCardsByTag', {

                    params: {
                        tagString: props.filterCondition
                    }
                })
                    .then(response => {
                        setCards(response.data.data); // Update the cards state with the new data
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error); // Log any error that occurs during the fetch
                    });
                //alert("Underconstruction");
            } else {
                showAll();
                filterCategoryAndTag(props.CategoryCondition, props.filterCondition)

                api.get('/allCardsByTag', {

                    params: {
                        categoryString: props.CategoryCondition,
                        tagString: props.filterCondition
                    }
                })
                    .then(response => {
                        setCards(response.data.data); // Update the cards state with the new data
                    })
                    .catch(error => {
                        console.error('Error fetching cards by tag:', error); // Log any error that occurs during the fetch
                    });
                //alert("Underconstruction");
            }
        }
    }, [props.filterCondition, props.CategoryCondition]); // Only run if props.filterCondition changes

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


    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const res = await api.get('/getBookmarkedCards', {
                    params: { username: 'your-logged-in-username' } // Replace or get from props
                });
    
                const titles = new Set(res.data.bookmarkedCards.map(card => card.title));
                setBookmarkedTitles(titles);
            } catch (err) {
                console.error("Failed to fetch bookmarks:", err);
            }
        };
    
        fetchBookmarks();
    }, []);


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
                        if (response.data.data.length > 0 && typeof response.data.data[0].title === 'string' && isNaN(Number(response.data.data[0].title))) {
                            console.log('Success:', response.data);
                            setCards(response.data.data);
                        } else {
                            // Handle the case where the first title is not as expected
                            console.error('Invalid card data: First title is a number or not a string', response.data.data);
                            if (isfetched) {
                                isfetched = false;
                                // const response = await api.get('/allCards');
                                // if (isMounted) {
                                //     console.log('Success:', response.data);
                                //     setCards(response.data.data);
                                // }
                                fetchData();

                            }

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
        <section id="content-2" className={isCollapsed ? 'collapsed' : ''}>
            <div className="collapse-toggle" onClick={toggleCollapse}>
                <FontAwesomeIcon icon={isCollapsed ? faAngleDoubleLeft : faAngleDoubleRight} />
            </div>

            <div className="card-container" style={{ display: isCollapsed ? 'none' : 'block' }}>
                {cards.map((card, index) => (
                    <Card key={`${card.title}-${index}`} formData={card} />
                ))}
            </div>
        </section>
    );
}

export default Content2;
