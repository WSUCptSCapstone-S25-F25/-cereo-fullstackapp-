import React, { useState } from 'react';
import Header from './Header';
import Main from './Main';

function Home(props) {
    const [filterCondition, setFilterCondition] = useState('');
    const [CategoryCondition, setCategoryConditionCondition] = useState('');
    const [searchCondition, setSearchCondition] = useState('');
    const coordinates = {
        NE: {
            Lng: -116.5981,
            Lat: 47.0114
        },
        SW: {
            Lng: -117.7654,
            Lat: 46.4466
        }
    };
    const [boundCondition, setboundCondition] = useState(coordinates);

    return (
        <div>
            <Header
                isLoggedIn={props.isLoggedIn}
                filterCondition={filterCondition}
                setFilterCondition={setFilterCondition}
                searchCondition={searchCondition}
                setSearchCondition={setSearchCondition}
                CategoryCondition={CategoryCondition}
                setCategoryConditionCondition={setCategoryConditionCondition}
                email={props.email}
                username={props.username}
                isAdmin={props.isAdmin}
            />
            <Main
                filterCondition={filterCondition}
                setFilterCondition={setFilterCondition}
                searchCondition={searchCondition}
                setSearchCondition={setSearchCondition}
                boundCondition={boundCondition}
                setboundCondition={setboundCondition}
                CategoryCondition={CategoryCondition}
                setCategoryConditionCondition={setCategoryConditionCondition}
                isAdmin={props.isAdmin} // Pass isAdmin down to Main
            />
            {props.isLoggedIn && props.isAdmin && <p>Welcome, admin user!</p>}
        </div>
    );
}

export default Home;
