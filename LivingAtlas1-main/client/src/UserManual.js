import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart as solidHeart,
  faMagnifyingGlass,
  faPlus,
  faMapMarkerAlt,
  faSort,
  faFilter,
  faHeart,
  faSearch,
  faTimes,
  faList,
  faGrip,
  faRightLeft,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart } from '@fortawesome/free-regular-svg-icons';
import './Card.css';
import './Content2.css';
import './SortDropdown.css';
import './FilterDropdown.css';
import './UserManual.css';

function UserManual() {
  return (
    <div className="user-manual">
      <h1>User Manual</h1>
      <p className="user-manual-intro">
        This guide explains every interactive feature available on a data card.
        The demos below use the exact same styles and hover effects as the real application —
        try hovering over each element to see it in action.
      </p>

      {/* ===== Card Container Features ===== */}
      <section className="um-section">
        <h2>Card Container</h2>
        <p className="um-section-desc">
          Each dataset or resource is displayed as a card in the main view. The demo below
          shows a fully-styled sample card. Hover over it to explore its interactive states,
          then read the feature-by-feature breakdown below.
        </p>

        {/* ---- Full annotated demo card ---- */}
        <div className="um-card-demo-wrapper">
          <span className="um-card-demo-label">Demo card — hover to explore</span>
          <div className="um-card-container">
            <div className="card">
              {/* Favorite icon */}
              <span
                className="favorite-icon"
                title="Favorite / Bookmark"
                aria-label="Favorite"
              >
                <FontAwesomeIcon icon={regularHeart} />
              </span>

              {/* Thumbnail container with nav arrows + dots */}
              <div className="card-thumbnail-container">
                <img
                  src="/CEREO-logo.png"
                  alt="Demo thumbnail"
                  className="card-thumbnail"
                />
                <button
                  className="card-image-nav card-image-nav-prev"
                  aria-label="Previous image"
                  tabIndex={-1}
                >
                  ❮
                </button>
                <button
                  className="card-image-nav card-image-nav-next"
                  aria-label="Next image"
                  tabIndex={-1}
                >
                  ❯
                </button>
                <div className="card-image-indicators">
                  <span className="card-image-dot active" />
                  <span className="card-image-dot" />
                  <span className="card-image-dot small" />
                </div>
              </div>

              {/* Title */}
              <div className="card-title-row">
                <h2 className="card-title">Sample Dataset Title</h2>
              </div>

              {/* Category + zoom */}
              <div className="card-meta-row">
                <p className="card-meta">Watershed</p>
                <button
                  className="card-meta-zoom-btn"
                  title="Locate on map"
                  aria-label="Locate on map"
                  tabIndex={-1}
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Feature rows ---- */}
        <div className="um-feature-list">

          {/* 1. Thumbnail */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="card-thumbnail-container um-thumb-demo">
                <img src="/CEREO-logo.png" alt="Demo thumbnail" className="card-thumbnail" />
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Card Image / Thumbnail</p>
              <p className="um-feature-desc">
                A representative image sits at the top of every card. If no image has been
                uploaded for a card, the CEREO logo is shown as a placeholder. Hover over
                the thumbnail area to see a subtle brightness/saturation effect.
              </p>
            </div>
          </div>

          {/* 2. Multi-image navigation */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="card-thumbnail-container um-thumb-demo">
                <img src="/CEREO-logo.png" alt="Demo thumbnail" className="card-thumbnail" />
                <button
                  className="card-image-nav card-image-nav-prev"
                  aria-label="Previous image"
                  tabIndex={-1}
                >
                  ❮
                </button>
                <button
                  className="card-image-nav card-image-nav-next"
                  aria-label="Next image"
                  tabIndex={-1}
                >
                  ❯
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Multi-Image Navigation</p>
              <p className="um-feature-desc">
                When a card has more than one image, left (❮) and right (❯) arrow
                buttons appear on hover over the thumbnail area. Click them to browse through
                all available images without opening the detail view.
              </p>
              <span className="um-feature-note">
                In the demo the arrows are always visible; on real cards they appear only on hover.
              </span>
            </div>
          </div>

          {/* 3. Indicator dots */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-dots-demo">
                <div className="card-image-indicators">
                  <span className="card-image-dot active" />
                  <span className="card-image-dot" />
                  <span className="card-image-dot small" />
                  <span className="card-image-dot small" />
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Image Indicator Dots</p>
              <p className="um-feature-desc">
                A row of dots at the bottom of the thumbnail shows the total number of images
                and highlights the currently displayed one in white. Up to five dots are shown
                at a time; dots further from the active image appear slightly smaller.
              </p>
            </div>
          </div>

          {/* 4. Full-size preview */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="card-thumbnail-container um-thumb-demo">
                <img
                  src="/CEREO-logo.png"
                  alt="Demo thumbnail"
                  className="card-thumbnail"
                  style={{ cursor: 'zoom-in' }}
                />
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Full-Size Image Preview</p>
              <p className="um-feature-desc">
                Clicking directly on the thumbnail image opens an enlarged preview overlay.
                Inside the preview you can navigate between images with arrow buttons, or
                close it by clicking outside.
              </p>
              <span className="um-feature-note">
                The cursor changes to a zoom-in icon when hovering over the clickable image area.
              </span>
            </div>
          </div>

          {/* 5. Favorite */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <span
                  className="favorite-icon"
                  title="Unfavorited"
                  style={{ position: 'static' }}
                  aria-label="Unfavorited heart"
                >
                  <FontAwesomeIcon icon={regularHeart} />
                </span>
                <span
                  className="favorite-icon filled"
                  title="Favorited"
                  style={{ position: 'static' }}
                  aria-label="Favorited heart"
                >
                  <FontAwesomeIcon icon={solidHeart} />
                </span>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Favorite / Bookmark</p>
              <p className="um-feature-desc">
                The heart icon in the upper-right corner of each card lets you save cards to
                your personal favorites list. An outlined heart means unfavorited; a filled
                red heart means favorited. Click to toggle. Hover to see the scale effect.
              </p>
              <span className="um-feature-note">
                You must be logged in to use this feature. A login prompt will appear if you are not.
              </span>
            </div>
          </div>

          {/* 6. Card title */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-meta-row-demo">
                <div className="card" style={{ pointerEvents: 'none' }}>
                  <div style={{ width: '100%', height: 0 }} />
                  <div className="card-title-row">
                    <h2 className="card-title">Long Sample Dataset Title That Gets Truncated</h2>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Card Title</p>
              <p className="um-feature-desc">
                The dataset name is displayed below the thumbnail. Titles are clamped to two
                lines; if the title is longer it is cut off with an ellipsis. The full title
                is always visible inside the detail view.
              </p>
            </div>
          </div>

          {/* 7. Category tag */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-meta-row-demo">
                <div className="card" style={{ pointerEvents: 'none' }}>
                  <div style={{ width: '100%', height: 0 }} />
                  <div className="card-title-row">
                    <h2 className="card-title">Sample Title</h2>
                  </div>
                  <div className="card-meta-row">
                    <p className="card-meta">Watershed</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Category Tag</p>
              <p className="um-feature-desc">
                A small label below the title shows the card's category. The available
                categories are: <strong>River</strong>, <strong>Watershed</strong>,{' '}
                <strong>Places</strong>, and <strong>Other</strong>. Cards without a
                category show "Uncategorized".
              </p>
            </div>
          </div>

          {/* 8. Zoom to map */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-meta-row-demo">
                <div className="card" style={{ pointerEvents: 'none' }}>
                  <div style={{ width: '100%', height: 0 }} />
                  <div className="card-title-row">
                    <h2 className="card-title">Sample Title</h2>
                  </div>
                  <div className="card-meta-row">
                    <p className="card-meta">River</p>
                    <button
                      className="card-meta-zoom-btn"
                      title="Locate on map"
                      aria-label="Locate on map"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Zoom to Map</p>
              <p className="um-feature-desc">
                The circular magnifying-glass button on the right side of the category row
                flies the main map to the card's location — either a point marker or a
                polygon area. Hover over it to see the scale effect; click it to animate
                the map.
              </p>
            </div>
          </div>

          {/* 9. Open details */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-card-container">
                <div className="card" style={{ cursor: 'pointer' }}>
                  <div className="card-thumbnail-container" style={{ aspectRatio: '280/100' }}>
                    <img src="/CEREO-logo.png" alt="Demo thumbnail" className="card-thumbnail" />
                  </div>
                  <div className="card-title-row">
                    <h2 className="card-title">Click anywhere to open</h2>
                  </div>
                  <div className="card-meta-row">
                    <p className="card-meta">Places</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Open Detail View</p>
              <p className="um-feature-desc">
                Clicking anywhere on the card body (except the image, favorite icon, or
                zoom button) opens the full detail view. There you can read the complete
                description, browse all images, view linked map layers, and access attached
                files and links.
              </p>
              <span className="um-feature-note">
                Hover over the demo card to see the lift-and-shadow effect that indicates it is clickable.
              </span>
            </div>
          </div>

          {/* 10. Map-selected highlight */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-card-container">
                <div className="card card--map-selected" style={{ pointerEvents: 'none' }}>
                  <div className="card-thumbnail-container" style={{ aspectRatio: '280/100' }}>
                    <img src="/CEREO-logo.png" alt="Demo thumbnail" className="card-thumbnail" />
                  </div>
                  <div className="card-title-row">
                    <h2 className="card-title">Map-Selected Card</h2>
                  </div>
                  <div className="card-meta-row">
                    <p className="card-meta">Other</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Map-Selected Highlight</p>
              <p className="um-feature-desc">
                When you click a card's location marker or polygon directly on the map, that
                card is highlighted with a blue border and glow in the card list. This makes
                it easy to identify which card corresponds to a map feature you clicked.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 2: Card Panel Toolbar ── */}
      <section className="um-section">
        <h2>Card Panel Toolbar</h2>
        <p className="um-section-desc">
          The toolbar at the top of the card panel provides controls to add cards, adjust the
          map, sort, filter, and switch view modes. Hover each element in the demo below to
          see its interactive state.
        </p>

        {/* Full toolbar demo */}
        <div className="um-toolbar-demo-wrapper">
          <div className="card-panel-top" style={{ borderRadius: '8px', border: '1px solid #d8e1ea' }}>
            <div className="card-panel-toolbar">
              <button type="button" className="card-toolbar-button card-toolbar-button--icon" title="Add Card">
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <button type="button" className="card-toolbar-button card-toolbar-button--icon" title="Hide Markers">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
              </button>
              <div className="sort-dropdown" style={{ width: 'auto' }}>
                <button type="button" className="sort-dropdown-trigger" title="Sort cards">
                  <FontAwesomeIcon icon={faSort} />
                  <span>Sort By</span>
                </button>
              </div>
              <div className="filter-dropdown">
                <button type="button" className="filter-dropdown-trigger" title="Filter">
                  <FontAwesomeIcon icon={faFilter} />
                  <span>Filter</span>
                </button>
              </div>
              <button type="button" className="card-toolbar-button" title="Show only favorited cards">
                <FontAwesomeIcon icon={faHeart} />
                <span>Favorites</span>
              </button>
              <button type="button" className="card-toolbar-button card-toolbar-button--scope all-cards" title="Scope">
                All Cards
              </button>
              <button type="button" className="card-toolbar-button card-toolbar-button--icon" title="List View">
                <FontAwesomeIcon icon={faList} />
              </button>
              <button type="button" className="card-toolbar-button card-toolbar-button--icon" title="Move panel to left">
                <FontAwesomeIcon icon={faRightLeft} />
              </button>
            </div>
            <div className="card-panel-searchbar">
              <input type="text" placeholder="Search cards..." readOnly />
              <button type="button" className="card-panel-searchbar-btn search" title="Search">
                <FontAwesomeIcon icon={faSearch} />
              </button>
              <button type="button" className="card-panel-searchbar-btn clear" title="Clear Search">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="card-panel-info-bar">
              <span className="card-panel-title">Cards</span>
              <span className="card-panel-subtitle">24 all cards</span>
            </div>
          </div>
        </div>

        <div className="um-feature-list">

          {/* 1. Add Card */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <button type="button" className="card-toolbar-button card-toolbar-button--icon" title="Add Card" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Add Card</p>
              <p className="um-feature-desc">
                Opens the card creation form so you can add a new dataset entry to the atlas.
                You must be logged in to use this button; if you are not, a prompt will
                appear asking you to sign in first.
              </p>
            </div>
          </div>

          {/* 2. Toggle Markers */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="card-toolbar-button card-toolbar-button--icon" title="Hide Markers" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                </button>
                <button type="button" className="card-toolbar-button card-toolbar-button--icon active" title="Show Markers" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Toggle Map Markers</p>
              <p className="um-feature-desc">
                Shows or hides all card location markers on the map. The button becomes
                highlighted (amber tint) when markers are currently hidden, so you can
                quickly tell whether markers are visible or not.
              </p>
            </div>
          </div>

          {/* 3. Sort Dropdown */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="sort-dropdown" style={{ width: 'auto' }}>
                  <button type="button" className="sort-dropdown-trigger" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faSort} />
                    <span>Newest First</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Sort By</p>
              <p className="um-feature-desc">
                Opens a dropdown to choose the card ordering: <strong>Newest First</strong>,{' '}
                <strong>Oldest First</strong>, <strong>Closest To Me</strong>, or{' '}
                <strong>Closest To Pin</strong>. Click Apply to confirm the selection or
                Clear to reset to default order.
              </p>
            </div>
          </div>

          {/* 4. Filter Dropdown */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ display: 'flex', gap: '8px' }}>
                <div className="filter-dropdown">
                  <button type="button" className="filter-dropdown-trigger" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faFilter} />
                    <span>Filter</span>
                  </button>
                </div>
                <div className="filter-dropdown">
                  <button type="button" className="filter-dropdown-trigger active" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faFilter} />
                    <span>Filter</span>
                    <span className="filter-dropdown-badge">2</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Filter</p>
              <p className="um-feature-desc">
                Opens a dropdown to filter cards by category (River, Watershed, Places,
                Other) and by custom tags. When one or more filters are active the button
                turns amber and shows a blue badge with the number of active filters.
              </p>
            </div>
          </div>

          {/* 5. Favorites toggle */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="card-toolbar-button" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faHeart} />
                  <span>Favorites</span>
                </button>
                <button type="button" className="card-toolbar-button active" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faHeart} />
                  <span>Favorites On</span>
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Favorites Filter</p>
              <p className="um-feature-desc">
                Toggles a filter that shows only your bookmarked (favorited) cards. When
                active the button turns amber and the label changes to "Favorites On". You
                must be logged in to use this feature.
              </p>
            </div>
          </div>

          {/* 6. Scope toggle */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="card-toolbar-button card-toolbar-button--scope all-cards" style={{ pointerEvents: 'none' }}>
                  All Cards
                </button>
                <button type="button" className="card-toolbar-button card-toolbar-button--scope in-view" style={{ pointerEvents: 'none' }}>
                  In View
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">View Scope</p>
              <p className="um-feature-desc">
                Switches between showing <strong>All Cards</strong> from the database or only
                cards whose location falls within the <strong>current map viewport</strong>.
                When "In View" is active the card count in the info bar updates as you pan
                and zoom the map.
              </p>
            </div>
          </div>

          {/* 7. Grid / List toggle */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="card-toolbar-button card-toolbar-button--icon" title="List View" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faList} />
                </button>
                <button type="button" className="card-toolbar-button card-toolbar-button--icon active" title="Grid View" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faGrip} />
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Grid / List View</p>
              <p className="um-feature-desc">
                Switches the card panel between <strong>grid view</strong> (card thumbnails
                laid out in a grid) and <strong>list view</strong> (compact rows showing just
                the title and action buttons). The icon shows the mode you will switch
                <em>to</em> when clicked. The button is highlighted when list view is active.
              </p>
            </div>
          </div>

          {/* 8. Move Panel */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <button type="button" className="card-toolbar-button card-toolbar-button--icon" title="Move panel to left" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faRightLeft} />
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Move Panel</p>
              <p className="um-feature-desc">
                Moves the card panel to the opposite side of the screen. Click once to dock
                it on the left, click again to move it back to the right. This is useful for
                keeping the panel out of the way of areas of the map you want to inspect.
              </p>
            </div>
          </div>

          {/* 9. Search bar */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-searchbar-demo">
                <div className="card-panel-searchbar">
                  <input type="text" defaultValue="watershed" readOnly />
                  <button type="button" className="card-panel-searchbar-btn search" title="Search" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faSearch} />
                  </button>
                  <button type="button" className="card-panel-searchbar-btn clear" title="Clear Search" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Card Search Bar</p>
              <p className="um-feature-desc">
                Type a keyword and press <strong>Enter</strong> or click the search button to
                search for cards by title or description. Click the{' '}
                <strong>&times;</strong> button to clear the search and return to the normal
                card listing. While a search is active the map viewport filter is
                temporarily suspended.
              </p>
            </div>
          </div>

          {/* 10. Info bar */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="card-panel-info-bar">
                  <span className="card-panel-title">Cards</span>
                  <span className="card-panel-subtitle">12 in view</span>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Card Count Info Bar</p>
              <p className="um-feature-desc">
                Shows the total number of cards currently displayed after all active filters
                are applied, along with a label indicating the scope ("all cards" or "in
                view"). The count updates in real time as you apply filters, search, or pan
                the map.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

export default UserManual;

