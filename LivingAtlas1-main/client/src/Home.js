import React, { useState } from 'react';
import Header from './Header';
import Main from './Main';
import Content2 from './Content2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faAngleDoubleLeft, faAngleDoubleRight } from '@fortawesome/free-solid-svg-icons';
import './Home.css';
import './Sidebars.css';

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
    
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleSearchModal = () => {
        setIsSearchModalOpen(!isSearchModalOpen);
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className="home-container">
            <div className={`left-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                {/* Left Sidebar Search Button */}
                <button className="left-sidebar-search-button" onClick={toggleSearchModal}>
                        <FontAwesomeIcon icon={faSearch} />
                </button>

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
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isSidebarOpen={isSidebarOpen}
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
            />
            {props.isLoggedIn && props.isAdmin}
            {/* {<p>Welcome, admin user!</p>} */}
        </div>
    );
}

export default Home;
