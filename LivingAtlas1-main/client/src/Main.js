import React from 'react';
import Content1 from './Content1';
import './Main.css';

// Main.js is called by Home.js
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
                isCollapsed={props.isCollapsed}
                setIsCollapsed={props.setIsCollapsed}
                isSidebarOpen={props.isSidebarOpen}
            />
        </main>
    );
}

export default Main;
