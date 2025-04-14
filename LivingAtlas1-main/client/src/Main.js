import React from 'react';
import Content1 from './Content1';
import Content2 from './Content2';
import './Main.css';

//Main.js is called by Home.js
function Main(props) {
    return (
        <main data-testid="test-main">
            <Content1
                boundCondition={props.boundCondition}
                setboundCondition={props.setboundCondition}
                searchCondition={props.searchCondition}
                setSearchCondition={props.setSearchCondition}
                sortCondition={props.sortCondition}
                setSortCondition={props.setSortCondition}
                CategoryCondition={props.CategoryCondition}
                setCategoryConditionCondition={props.setCategoryConditionCondition}
                filterCondition={props.filterCondition}
                setFilterCondition={props.setFilterCondition}
                showFavoritesOnly={props.showFavoritesOnly}
                bookmarkedCardIDs={props.bookmarkedCardIDs}
            />
            <Content2
                filterCondition={props.filterCondition}
                setFilterCondition={props.setFilterCondition}
                searchCondition={props.searchCondition}
                setSearchCondition={props.setSearchCondition}
                sortCondition={props.sortCondition}
                setSortCondition={props.setSortCondition}
                boundCondition={props.boundCondition}
                setboundCondition={props.setboundCondition}
                CategoryCondition={props.CategoryCondition}
                setCategoryConditionCondition={props.setCategoryConditionCondition}

                username={props.username}
                showFavoritesOnly={props.showFavoritesOnly}
                setShowFavoritesOnly={props.setShowFavoritesOnly}
                bookmarkedCardIDs={props.bookmarkedCardIDs}
                setBookmarkedCardIDs={props.setBookmarkedCardIDs}
            />
        </main>
    );
}

export default Main;
