import React from 'react';
import Content1 from './Content1';
import './Main.css';

// Main.js is called by Home.js
function Main(props) {

    // Debug: log when Main receives selectedCardCoords
    React.useEffect(() => {
        if (props.selectedCardCoords) {
            console.log('[Main] Received selectedCardCoords:', props.selectedCardCoords);
        }
    }, [props.selectedCardCoords]);

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

                isUploadPanelOpen={props.isUploadPanelOpen}
                isRemovedPanelOpen={props.isRemovedPanelOpen}
                isLayerPanelOpen={props.isLayerPanelOpen}
                isModalOpen={props.isModalOpen}

                selectedCardCoords={props.selectedCardCoords}

                isAdmin={props.isAdmin}
                username={props.username}
                isLoggedIn={props.isLoggedIn} /* NEW PROP */
            />
        </main>
    );
}

export default Main;