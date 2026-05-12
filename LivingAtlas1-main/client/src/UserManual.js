import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart as solidHeart,
  faMagnifyingGlass,
  faPlus,
  faMapMarkerAlt,
  faSort,
  faFilter,
  faThumbtack,
  faHeart,
  faSearch,
  faTimes,
  faList,
  faGrip,
  faRightLeft,
  faPenToSquare,
  faTrashCan,
  faDownload,
  faSync,
  faChevronUp,
  faChevronDown,
  faFolderPlus,
  faMap,
  faCamera,
  faEye,
  faEyeSlash,
  faDrawPolygon,
  faExpand,
  faCompress,
  faMinus,
  faLocationCrosshairs,
  faLocationDot,
  faImage,
  faRotate,
  faShapes,
  faPalette,
  faHand,
  faUpRightAndDownLeftFromCenter,
  faRotateLeft,
  faRotateRight,
  faTrash,
  faEllipsisV,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart, faFolder } from '@fortawesome/free-regular-svg-icons';
import './Card.css';
import './Content2.css';
import './SortDropdown.css';
import './FilterDropdown.css';
import './UserManual.css';
import './FormModal.css';
import './ArcGISPickerModal.css';
import './ArcgisUploadPanel.css';
import './CustomLayersPanel.css';
import './LayerContextMenu.css';
import './BasemapSwitcher.css';
import './Content1.css';
import './PolygonDrawingModal.css';

const SECTIONS = [
  { id: 'home',          label: '🏠  Overview' },
  { id: 'card-container', label: 'Card Container' },
  { id: 'toolbar',        label: 'Card Panel Toolbar' },
  { id: 'add-card',       label: 'Add Card Form' },
  { id: 'arcgis-picker',  label: 'ArcGIS Picker Modal' },
  { id: 'detail-view',   label: 'Card Detail View' },
  { id: 'arcgis-panel',     label: 'ArcGIS Upload Panel' },
  { id: 'service-layer-info', label: 'Service / Layer Info Modal' },
  { id: 'custom-layers',    label: 'Custom Layers Panel' },
  { id: 'basemap-panel',     label: 'Basemap Panel' },
  { id: 'map-controls',      label: 'Map Controls' },
  { id: 'polygon-draw',      label: 'Draw Polygon Panel' },
];

function UserManual() {
  const [activeSection, setActiveSection] = useState('home');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sec = params.get('section');
    if (sec && SECTIONS.some(s => s.id === sec)) {
      setActiveSection(sec);
    }
  }, []);
  const navTo = (id) => { setActiveSection(id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return (
    <div className="user-manual">
      <h1>User Manual</h1>

      <div className="um-layout">
        <nav className="um-nav-sidebar">
          <span className="um-nav-heading">Sections</span>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`um-nav-item${activeSection === s.id ? ' active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="um-content-area">

      {activeSection === 'home' && (
      <section className="um-section">
        <h2>Welcome to the User Manual</h2>
        <p className="um-section-desc">
          This guide explains every interactive feature available in the RWC Living Atlas.
          Use the navigation on the left to browse each section — demos use the exact same
          styles and hover effects as the real application, so you can try them directly
          on this page.
        </p>

        <div className="um-home-cards">
          {SECTIONS.filter(s => s.id !== 'home').map(s => (
            <button
              key={s.id}
              className="um-home-card"
              onClick={() => setActiveSection(s.id)}
            >
              <span className="um-home-card-title">{s.label}</span>
              {{
                'card-container': 'How cards are displayed, navigated, pinned, and favorited.',
                'toolbar':        'Tools for adding cards, sorting, filtering, and switching views.',
                'detail-view':    'The full-screen modal with editing, images, files, and ArcGIS layers.',
                'add-card':       'Submit a new research entry with location, description, links, images, files, and optional ArcGIS service associations.',
                'arcgis-picker':  'Browse and select ArcGIS services and layers to link directly to a card — opened from the Add Card form.',
                'arcgis-panel':   'Browse and toggle ArcGIS REST map layers organized by state, folder, and service.',
                'service-layer-info': 'Detailed guide for Service/Layer Info modal features: metadata, opacity, historical filters, links, and layer fields.',
                'custom-layers':  'Manage your personal saved layers with custom folders, drag-and-drop ordering, and pinned auto-load items.',
                'basemap-panel':   'Switch between six Mapbox map styles while preserving your ArcGIS layers, camera position, and zoom level.',
                'map-controls':    'All interactive buttons on the map canvas — search, fullscreen, zoom, compass, geolocate, draw, and more.',
                'polygon-draw':    'Draw freehand or preset-shape polygons to spatially filter cards, with style, transform, and history tools.',
              }[s.id]}
            </button>
          ))}
        </div>
      </section>
      )}

      {activeSection === 'card-container' && (
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
          <div className="um-card-container" style={{ position: 'relative' }}>
            <button className="card-grid-pin-btn" title="Pin to top" style={{ pointerEvents: 'none' }}>
              <FontAwesomeIcon icon={faThumbtack} />
            </button>
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

          {/* 6. Pin to Top */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ gap: '14px' }}>
                <button className="card-grid-pin-btn" style={{ position: 'static', pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faThumbtack} />
                </button>
                <button className="card-grid-pin-btn active" style={{ position: 'static', pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faThumbtack} />
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Pin to Top</p>
              <p className="um-feature-desc">
                The thumbtack icon in the upper-left corner of each card lets you pin that
                card to the top of the card list. An unpinned button has a white background;
                a pinned button turns gold. Pinned cards always appear first, regardless of
                the current sort order. Click to toggle.
              </p>
              <span className="um-feature-note">
                You must be logged in to use this feature. A login prompt will appear if you are not.
              </span>
            </div>
          </div>

          {/* 7. Card title */}
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
      )}

      {activeSection === 'toolbar' && (
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
      )}

      {activeSection === 'add-card' && (
      <section className="um-section">
        <h2>Add Card Form</h2>
        <p className="um-section-desc">
          The Add Card form lets you submit a new research entry to the atlas. Click the{' '}
          <strong>+</strong> button in the card panel toolbar to open it. You must be logged
          in — a login prompt appears otherwise. You can also start location-first creation
          from the map toolbar using the <strong>Single Point</strong>, <strong>Draw Polygon</strong>, and{' '}
          <strong>Add PNG image to map</strong> buttons. Once submitted, the new card appears in the
          card container and is pinned to the map.
        </p>

        {/* ---- Overview demo: compact scrollable form ---- */}
        <div className="um-form-demo-wrapper">
          <div className="um-form-demo-inner">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ margin: 0 }}>Create Card</h2>
              <button className="close-modal-button" style={{ position: 'static', fontSize: '20px', pointerEvents: 'none' }}>&times;</button>
            </div>
            <label>Author Name (required):</label>
            <input type="text" readOnly placeholder="Jane Doe" className="um-form-input-mock" />
            <label>Email (required):</label>
            <input type="text" readOnly placeholder="jane@example.com" className="um-form-input-mock" />
            <label>Title (required):</label>
            <input type="text" readOnly placeholder="WA Watershed Study 2024" className="um-form-input-mock" />
            <label>Category:</label>
            <select disabled className="um-form-input-mock">
              <option>Select a Category</option>
              <option>River</option>
            </select>
            <label>Description:</label>
            <textarea readOnly rows={2} placeholder="A brief summary of the dataset…" className="um-form-input-mock" style={{ resize: 'none' }} />
            <label>Links:</label>
            <div className="form-modal-link-row" style={{ pointerEvents: 'none' }}>
              <input type="text" readOnly placeholder="URL" className="form-modal-link-input" />
              <input type="text" readOnly placeholder="Display text" className="form-modal-link-input form-modal-link-text-input" />
            </div>
            <label style={{ marginTop: '8px' }}>Location Type:</label>
            <div className="form-modal-location-tabs" style={{ pointerEvents: 'none', marginBottom: '10px' }}>
              <button type="button" className="form-modal-location-tab active">Single Point</button>
              <button type="button" className="form-modal-location-tab">Polygon Area</button>
              <button type="button" className="form-modal-location-tab">Image Overlay</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <button type="button" style={{ background: '#0077c0', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 18px', fontWeight: 600, fontSize: '13px', cursor: 'default' }}>Submit</button>
              <button type="button" className="cancel_button" style={{ pointerEvents: 'none', fontSize: '13px' }}>Cancel</button>
            </div>
          </div>
        </div>

        {/* ---- Feature rows ---- */}
        <div className="um-feature-list">

          {/* 1. Opening the Form */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <button type="button" className="card-toolbar-button card-toolbar-button--icon" title="Add Card" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Opening the Form</p>
              <p className="um-feature-desc">
                Click the <strong>+</strong> button in the card panel toolbar. Login is
                required; if you are not logged in, a prompt appears instead. You can also
                open this form from map toolbar shortcuts (single point, polygon, image overlay)
                with location pre-filled. The form slides in as a side panel over the map.
              </p>
            </div>
          </div>

          {/* 2. Required Fields */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '260px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374957', marginBottom: '3px' }}>Author Name <span style={{ color: '#e05' }}>*</span></label>
                <input type="text" readOnly defaultValue="Jane Doe" className="um-form-input-mock" style={{ marginBottom: '8px' }} />
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374957', marginBottom: '3px' }}>Title <span style={{ color: '#e05' }}>*</span></label>
                <input type="text" readOnly defaultValue="WA Watershed Study 2024" className="um-form-input-mock" style={{ marginBottom: '8px' }} />
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374957', marginBottom: '3px' }}>Category</label>
                <select disabled className="um-form-input-mock">
                  <option>River</option>
                </select>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Required Fields</p>
              <p className="um-feature-desc">
                <strong>Author Name</strong>, <strong>Email</strong>, and <strong>Title</strong>{' '}
                are required. <strong>Category</strong> is optional and can be one of:
                River, Watershed, Places, or Other. Validation runs on submit and
                highlights any missing or invalid fields.
              </p>
            </div>
          </div>

          {/* 3. Optional Info Fields */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '260px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374957', marginBottom: '3px' }}>Description</label>
                <textarea readOnly rows={2} defaultValue="Longitudinal stream temperature data…" className="um-form-input-mock" style={{ resize: 'none', marginBottom: '8px' }} />
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374957', marginBottom: '3px' }}>Funding</label>
                <input type="text" readOnly defaultValue="NSF Grant #1234567" className="um-form-input-mock" style={{ marginBottom: '8px' }} />
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374957', marginBottom: '3px' }}>Tags (comma-separated)</label>
                <input type="text" readOnly defaultValue="river, temperature, salmon" className="um-form-input-mock" />
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Content Fields</p>
              <p className="um-feature-desc">
                <strong>Description</strong> (max 2000 chars), <strong>Funding</strong>,
                and <strong>Organization</strong> provide context for the card.{' '}
                <strong>Tags</strong> (comma-separated) make cards discoverable in
                search and filter. None of these are required.
              </p>
            </div>
          </div>

          {/* 4. Links */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '280px' }}>
                <div className="form-modal-link-row" style={{ pointerEvents: 'none' }}>
                  <input type="text" readOnly defaultValue="https://example.gov/data" className="form-modal-link-input" />
                  <input type="text" readOnly defaultValue="Dataset Portal" className="form-modal-link-input form-modal-link-text-input" />
                </div>
                <div className="form-modal-link-row" style={{ pointerEvents: 'none' }}>
                  <input type="text" readOnly placeholder="URL" className="form-modal-link-input" />
                  <input type="text" readOnly placeholder="Display text (optional)" className="form-modal-link-input form-modal-link-text-input" />
                </div>
                <button type="button" className="form-modal-add-link-btn" style={{ pointerEvents: 'none', alignSelf: 'flex-start', marginTop: '4px' }}>+ Add More Links</button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Links</p>
              <p className="um-feature-desc">
                Add one or more external links with optional display text. Click{' '}
                <strong>+ Add More Links</strong> to add additional rows. Links appear
                as clickable buttons on the card's Detail View.
              </p>
            </div>
          </div>

          {/* 5. Location */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '260px', gap: '8px' }}>
                <div className="form-modal-location-tabs" style={{ pointerEvents: 'none' }}>
                  <button type="button" className="form-modal-location-tab active">Single Point</button>
                  <button type="button" className="form-modal-location-tab">Polygon Area</button>
                  <button type="button" className="form-modal-location-tab">Image Overlay</button>
                </div>
                <button type="button" className="location_button" style={{ pointerEvents: 'none', marginBottom: 0 }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ marginRight: '6px' }} />
                  Select a Location
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" readOnly placeholder="Latitude" className="um-form-input-mock" style={{ margin: 0 }} />
                  <input type="text" readOnly placeholder="Longitude" className="um-form-input-mock" style={{ margin: 0 }} />
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Location Picker</p>
              <p className="um-feature-desc">
                Choose <strong>Single Point</strong> to click on the map and confirm a
                lat/lng coordinate, or enter coordinates manually. Choose{' '}
                <strong>Polygon Area</strong> to draw a custom polygon directly on the
                map. Choose <strong>Image Overlay</strong> to place a PNG on the map with
                move/rotate/resize support. For polygon/image modes, centroid is stored as
                the card's primary location. Location is required for card submission.
              </p>
            </div>
          </div>

          {/* 5b. Polygon Area sub-options */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '240px', gap: '10px', pointerEvents: 'none' }}>
                {/* tabs — polygon active */}
                <div className="form-modal-location-tabs">
                  <button type="button" className="form-modal-location-tab">Single Point</button>
                  <button type="button" className="form-modal-location-tab active">Polygon Area</button>
                  <button type="button" className="form-modal-location-tab">Image Overlay</button>
                </div>
                {/* polygon section */}
                <div className="form-modal-polygon-section">
                  <button type="button" className="location_button" style={{ marginBottom: 0 }}>
                    <FontAwesomeIcon icon={faDrawPolygon} style={{ marginRight: '6px' }} />
                    Draw Polygon on Map
                  </button>
                  <div className="form-modal-polygon-summary">
                    <span className="form-modal-polygon-check">&#10003;</span>
                    Polygon saved: 5 points
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Polygon Area Mode</p>
              <p className="um-feature-desc">
                After switching to <strong>Polygon Area</strong>, click{' '}
                <strong>Draw Polygon on Map</strong> to open the Draw Polygon Panel
                floating on the map. Place vertices by clicking the map, then click{' '}
                <strong>Save</strong> in the panel to confirm. The form shows a
                confirmation summary (e.g. "Polygon saved: 5 points"). You can click{' '}
                <strong>Redraw Polygon</strong> at any time to replace the shape.
              </p>
              <p className="um-feature-desc" style={{ marginTop: '8px' }}>
                For a full breakdown of the drawing tools, styles, and transform modes,
                see the{' '}
                <button
                  type="button"
                  className="um-inline-link"
                  onClick={() => navTo('polygon-draw')}
                >
                  Draw Polygon Panel
                </button>{' '}tab.
              </p>
            </div>
          </div>

          {/* 6. Images & Files */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '240px', gap: '8px' }}>
                <div className="form-modal-image-upload-area" style={{ pointerEvents: 'none', padding: '12px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>Click or drag to add images</p>
                  <span className="form-modal-image-upload-btn" style={{ fontSize: '12px', padding: '4px 10px' }}>Choose Images</span>
                </div>
                <div className="form-modal-file-upload-area" style={{ pointerEvents: 'none', padding: '12px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>Click to add files (max 5 MB)</p>
                  <span className="form-modal-image-upload-btn" style={{ fontSize: '12px', padding: '4px 10px' }}>Choose Files</span>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Images &amp; File Attachments</p>
              <p className="um-feature-desc">
                Upload one or more images (PNG, JPG, GIF, WebP, max 5 MB each). The
                first image becomes the card's thumbnail for point/polygon cards. For
                image-overlay cards, the map representation image is managed separately,
                and these images are used for the Learn More gallery. Upload supporting files
                (PDFs, spreadsheets, etc., max 5 MB each) that viewers can download
                from the Card Detail View.
              </p>
            </div>
          </div>

          {/* 7. Linked ArcGIS Services */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <button type="button" className="location_button" style={{ pointerEvents: 'none', marginBottom: 0 }}>
                  + Link ArcGIS Service / Layer
                </button>
                <div className="form-modal-file-list" style={{ width: '100%' }}>
                  <div className="form-modal-file-item" style={{ pointerEvents: 'none' }}>
                    <span>WA Streams and Rivers — Stream Layer</span>
                    <button type="button">&times;</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Linked ArcGIS Services</p>
              <p className="um-feature-desc">
                Optionally link ArcGIS services or individual layers to the card. Click{' '}
                <strong>+ Link ArcGIS Service / Layer</strong> to open the ArcGIS picker
                and browse by state. Linked items appear in the Card Detail View and can
                be toggled directly on the map from there. Multiple links can be added.
              </p>
            </div>
          </div>

          {/* 8. Card marker / polygon map popup */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ padding: 0, minWidth: '260px', maxWidth: '300px', alignItems: 'stretch' }}>
                <div className="um-card-popup-demo-wrapper">
                  <div className="card-pin-popup-panel">
                    {/* thumbnail area */}
                    <div className="card-pin-popup-media">
                      <div style={{ width: '100%', height: '120px', background: '#d9dde3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>Card thumbnail</span>
                      </div>
                    </div>
                    {/* info panel */}
                    <div className="card-pin-popup-info-panel" style={{ cursor: 'default' }}>
                      <h3 className="card-pin-popup-title">Palouse Riparian Study</h3>
                      <p className="card-pin-popup-category">Hydrology</p>
                      <p className="card-pin-popup-tags">Tags: riparian, stream, ecology</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Card Marker / Polygon Popup</p>
              <p className="um-feature-desc">
                Clicking a card marker pin or a card polygon on the map opens a rich popup.
                The top section shows the card's thumbnail image — if multiple images are
                attached, <strong>❮ ❯</strong> arrows appear on hover to cycle through them;
                clicking the image opens a fullscreen lightbox. The bottom section shows the
                card <strong>title</strong>, <strong>category</strong>, and <strong>tags</strong>.
                Clicking anywhere on the info area opens the full <strong>Card Detail View</strong>.
              </p>
            </div>
          </div>

        </div>
      </section>
      )}

      {activeSection === 'arcgis-picker' && (
      <section className="um-section">
        <h2>ArcGIS Picker Modal</h2>
        <p className="um-section-desc">
          The ArcGIS Picker lets you search and select ArcGIS services or individual layers
          to link to a card. It opens from the <strong>+ Link ArcGIS Service / Layer</strong>{' '}
          button inside the Add Card form. Selected items are attached to the card and can be
          toggled on the map from the Card Detail View.
        </p>

        {/* ---- Overview demo ---- */}
        <div className="um-picker-demo-wrapper">
          {/* Header */}
          <div className="arcgis-picker-header" style={{ borderBottom: '1px solid #e0e0e0' }}>
            <div className="arcgis-picker-search-row">
              <input type="text" className="arcgis-picker-search-input" readOnly placeholder="Search folders, services, or layers…" />
              <select className="arcgis-picker-search-type-select" defaultValue="any" style={{ pointerEvents: 'none' }}>
                <option value="any">Any</option>
              </select>
              <button type="button" className="arcgis-picker-search-btn" style={{ pointerEvents: 'none' }}>
                <FontAwesomeIcon icon={faSearch} />
              </button>
              <button type="button" className="arcgis-picker-clear-btn" style={{ pointerEvents: 'none' }}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
          {/* Body */}
          <div style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div className="arcgis-picker-nav-state-row" style={{ pointerEvents: 'none' }}>
              <FontAwesomeIcon icon={faFolder} className="arcgis-picker-nav-folder-icon" />
              Washington State ArcGIS Services
            </div>
            <div className="arcgis-picker-nav-state-row" style={{ pointerEvents: 'none', opacity: 0.65 }}>
              <FontAwesomeIcon icon={faFolder} className="arcgis-picker-nav-folder-icon" />
              Idaho ArcGIS Services
            </div>
            <div className="arcgis-picker-nav-state-row" style={{ pointerEvents: 'none', opacity: 0.65 }}>
              <FontAwesomeIcon icon={faFolder} className="arcgis-picker-nav-folder-icon" />
              Oregon ArcGIS Services
            </div>
          </div>
          {/* Footer */}
          <div className="arcgis-picker-footer">
            <span className="arcgis-picker-count">0 items selected</span>
            <div className="arcgis-picker-footer-btns">
              <button type="button" className="arcgis-picker-cancel-btn" style={{ pointerEvents: 'none' }}>Cancel</button>
              <button type="button" className="arcgis-picker-add-btn" disabled style={{ pointerEvents: 'none' }}>Add</button>
            </div>
          </div>
        </div>

        {/* ---- Feature rows ---- */}
        <div className="um-feature-list">

          {/* 1. Opening */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <button type="button" className="location_button" style={{ pointerEvents: 'none', marginBottom: 0 }}>
                  + Link ArcGIS Service / Layer
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Opening the Picker</p>
              <p className="um-feature-desc">
                Click <strong>+ Link ArcGIS Service / Layer</strong> inside the Add Card
                form to open the picker. It loads available services from the database and
                falls back to the bundled local list if the database is unavailable.
              </p>
            </div>
          </div>

          {/* 2. Search */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '280px' }}>
                <div className="arcgis-picker-search-row" style={{ pointerEvents: 'none' }}>
                  <input type="text" className="arcgis-picker-search-input" readOnly defaultValue="streams" />
                  <select className="arcgis-picker-search-type-select" defaultValue="layer" style={{ pointerEvents: 'none' }}>
                    <option value="layer">Layer</option>
                  </select>
                  <button type="button" className="arcgis-picker-search-btn" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faSearch} />
                  </button>
                  <button type="button" className="arcgis-picker-clear-btn" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '6px', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#444', minWidth: '46px', textAlign: 'center' }}>2 / 7</span>
                  <button type="button" className="arcgis-picker-nav-btn" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faChevronUp} />
                  </button>
                  <button type="button" className="arcgis-picker-nav-btn" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faChevronDown} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Search Bar &amp; Navigation</p>
              <p className="um-feature-desc">
                Type a keyword and press Enter or click the search button. The type
                dropdown narrows results to <strong>Any</strong>, <strong>Folder</strong>,{' '}
                <strong>Service</strong>, or <strong>Layer</strong>. When multiple matches
                exist, a counter and Prev/Next arrows appear to jump between them.
              </p>
            </div>
          </div>

          {/* 3. Drill-down Navigation */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '260px', padding: 0, gap: 0 }}>
                {/* breadcrumb */}
                <div className="arcgis-picker-breadcrumb" style={{ pointerEvents: 'none' }}>
                  <button type="button" className="arcgis-picker-back-btn" style={{ pointerEvents: 'none' }}>←</button>
                  <span style={{ fontSize: '13px', color: '#2a4d7a' }}>Washington State ArcGIS Services <span style={{ color: '#999', margin: '0 4px' }}>/</span> Hydrology</span>
                </div>
                {/* folder rows */}
                <div className="arcgis-picker-nav-folder-row" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faFolder} className="arcgis-picker-nav-folder-icon" style={{ marginRight: '6px' }} />
                  Streams and Rivers
                </div>
                <div className="arcgis-picker-nav-folder-row" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faFolder} className="arcgis-picker-nav-folder-icon" style={{ marginRight: '6px' }} />
                  Watershed Boundaries
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Drill-Down Navigation</p>
              <p className="um-feature-desc">
                In navigation mode the root view shows three state tiles (WA, ID, OR).
                Click a state to see its folders; click a folder to see its services.
                A breadcrumb bar at the top shows your current path, and the Back button
                moves you one level up.
              </p>
            </div>
          </div>

          {/* 4. Service rows */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '260px', padding: 0, gap: 0 }}>
                <div className="arcgis-picker-service-row" style={{ pointerEvents: 'none' }}>
                  <input type="checkbox" className="arcgis-picker-checkbox" readOnly />
                  <span className="arcgis-picker-arrow">►</span>
                  <span className="arcgis-picker-service-label">WA Streams and Rivers</span>
                </div>
                <div className="arcgis-picker-service-row" style={{ pointerEvents: 'none', background: '#f0f4fa' }}>
                  <input type="checkbox" className="arcgis-picker-checkbox" defaultChecked readOnly style={{ accentColor: '#1d4ed8' }} />
                  <span className="arcgis-picker-arrow">▼</span>
                  <span className="arcgis-picker-service-label">Watershed Boundaries</span>
                </div>
                <div className="arcgis-picker-layers-content" style={{ pointerEvents: 'none' }}>
                  <div className="upload-layer-row" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0' }}>
                    <input type="checkbox" defaultChecked readOnly style={{ marginRight: '4px', accentColor: '#1d4ed8' }} />
                    <span className="upload-layer-name" style={{ fontSize: '0.82rem' }}>HUC 8 Boundaries</span>
                  </div>
                  <div className="upload-layer-row" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0' }}>
                    <input type="checkbox" readOnly style={{ marginRight: '4px' }} />
                    <span className="upload-layer-name" style={{ fontSize: '0.82rem' }}>HUC 12 Boundaries</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Services &amp; Layer Selection</p>
              <p className="um-feature-desc">
                Each service row has a checkbox and an expand arrow. Checking the service
                checkbox selects the whole service. Clicking the row expands it to show
                individual layers — check individual layers to link only those. Group
                layers expand recursively with their own checkboxes.
              </p>
            </div>
          </div>

          {/* 5. Footer */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '260px', padding: 0 }}>
                <div className="arcgis-picker-footer" style={{ pointerEvents: 'none' }}>
                  <span className="arcgis-picker-count">3 items selected</span>
                  <div className="arcgis-picker-footer-btns">
                    <button type="button" className="arcgis-picker-cancel-btn" style={{ pointerEvents: 'none' }}>Cancel</button>
                    <button type="button" className="arcgis-picker-add-btn" style={{ pointerEvents: 'none' }}>Add</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Add &amp; Cancel</p>
              <p className="um-feature-desc">
                The footer shows how many items are currently selected. <strong>Add</strong>{' '}
                is enabled once at least one item is selected; clicking it inserts all
                selected services and layers as linked items in the Add Card form.{' '}
                <strong>Cancel</strong> closes the picker without changing the form.
              </p>
            </div>
          </div>

        </div>
      </section>
      )}

      {activeSection === 'detail-view' && (
      <section className="um-section">
        <h2>Card Detail View</h2>
        <p className="um-section-desc">
          Clicking <strong>Open Detail View</strong> on a card opens a full-screen panel
          showing all dataset information. It also has tools for editing, downloading a PDF,
          managing images and files, and toggling linked ArcGIS map layers.
        </p>

        {/* Full static mock of the modal shell */}
        <div className="um-modal-demo-wrapper">
          <div className="learn-more-modal-shell" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
            <div className="learn-more-modal-toolbar">
              <div className="learn-more-modal-toolbar-left">
                <button className="learn-more-modal-edit-btn" title="Edit" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faPenToSquare} />
                </button>
                <button className="learn-more-modal-download-btn" title="Download as PDF" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faDownload} />
                </button>
                <button className="learn-more-modal-delete-btn" title="Delete card" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              </div>
              <div className="learn-more-modal-toolbar-right">
                <button className="learn-more-modal-close" style={{ pointerEvents: 'none' }}>×</button>
              </div>
            </div>
            <div className="learn-more-modal-body um-modal-body-preview">
              <div className="learn-more-gallery" style={{ margin: '0 0 16px' }}>
                <button type="button" className="learn-more-gallery-tile learn-more-gallery-tile--primary" style={{ pointerEvents: 'none', minHeight: '200px' }}>
                  <img className="learn-more-gallery-image" src="/CEREO-logo.png" alt="Primary" />
                </button>
                <div className="learn-more-gallery-side-grid">
                  {[1, 2, 3, 4].map(i => (
                    <button key={i} type="button" className="learn-more-gallery-tile" style={{ pointerEvents: 'none', minHeight: '80px' }}>
                      <img className="learn-more-gallery-image" src="/CEREO-logo.png" alt={`Image ${i + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="learn-more-see-all-images-btn" style={{ pointerEvents: 'none' }}>See all 5 images</button>
              <div className="learn-more-modal-title-section">
                <h2>Yakima River Basin Watershed Study</h2>
                <p className="learn-more-modal-subtitle">Watershed</p>
              </div>
              <div className="learn-more-fields-grid">
                <p><strong>Author:</strong> Jane Smith</p>
                <p><strong>Card Creator:</strong> jsmith</p>
                <p><strong>Email:</strong> j.smith@cereo.edu</p>
                <p><strong>Funding:</strong> NSF Grant #12345</p>
                <p><strong>Organization:</strong> CEREO</p>
                <p className="learn-more-coordinate-readonly">
                  <strong>Latitude:</strong> 46.6
                  <span className="learn-more-coordinate-separator"> | </span>
                  <strong>Longitude:</strong> -120.5
                </p>
              </div>
              <div className="learn-more-links-view">
                <strong>Links:</strong>
                <ul className="learn-more-links-list">
                  <li><a href="#um" onClick={e => e.preventDefault()}>CEREO Homepage</a></li>
                </ul>
              </div>
              <p className="learn-more-modal-description"><strong>Description:</strong> A comprehensive study of the Yakima River Basin watershed covering hydrology, ecology, and land-use patterns over a 10-year period.</p>
              <p><strong>Tags:</strong> hydrology, ecology, yakima, land-use</p>
              <div className="file-list learn-more-file-list">
                <h3>Downloadable Files:</h3>
                <ul><li><a href="#um" onClick={e => e.preventDefault()}>yakima_study_2023.pdf</a></li></ul>
              </div>
              <div className="learn-more-arcgis-links-section">
                <p><strong>Linked ArcGIS Services/Layers:</strong></p>
                <ul className="learn-more-arcgis-links-list">
                  <li className="learn-more-arcgis-link-item">
                    <label className="learn-more-arcgis-layer-toggle-label">
                      <input type="checkbox" className="learn-more-arcgis-layer-toggle-cb" defaultChecked readOnly />
                    </label>
                    <span className="learn-more-arcgis-link-row">
                      <span className="learn-more-arcgis-row-text">Washington State ArcGIS Services</span>
                      <span className="learn-more-arcgis-row-sep"> › </span>
                      <span className="learn-more-arcgis-row-text">Hydrology</span>
                      <span className="learn-more-arcgis-row-sep"> › </span>
                      <span className="learn-more-arcgis-row-text learn-more-arcgis-row-name">Streams &amp; Rivers</span>
                    </span>
                    <button type="button" className="learn-more-arcgis-goto-btn" style={{ pointerEvents: 'none' }}>›</button>
                  </li>
                </ul>
              </div>
              <p style={{ marginTop: '1.5rem', color: '#888', fontSize: '0.9rem', textAlign: 'right' }}>
                <strong>Created:</strong> January 15, 2024
              </p>
            </div>
          </div>
        </div>

        <div className="um-feature-list">

          {/* 1. Toolbar — view mode */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', minWidth: '220px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="learn-more-modal-edit-btn" title="Edit" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faPenToSquare} />
                  </button>
                  <button className="learn-more-modal-download-btn" title="Download as PDF" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faDownload} />
                  </button>
                  <button className="learn-more-modal-delete-btn" title="Delete card" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faTrashCan} />
                  </button>
                </div>
                <button className="learn-more-modal-close" style={{ pointerEvents: 'none' }}>×</button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Detail View Toolbar</p>
              <p className="um-feature-desc">
                The toolbar at the top provides four action buttons:
                <br />• <strong>Edit</strong> (pencil icon) — enter edit mode to modify card content
                <br />• <strong>Download PDF</strong> (download icon) — save the card as a PDF
                <br />• <strong>Delete</strong> (trash icon) — permanently delete the card
                <br />• <strong>Close</strong> (×) — close the Detail View and return to the map
                <br />Edit and Delete require you to be the card owner or an administrator.
              </p>
            </div>
          </div>

          {/* 2. Toolbar — edit mode */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="learn-more-modal-toolbar-actions">
                  <button className="learn-more-modal-toolbar-btn save" style={{ pointerEvents: 'none' }}>Save</button>
                  <button className="learn-more-modal-toolbar-btn cancel" style={{ pointerEvents: 'none' }}>Cancel</button>
                  <span className="learn-more-unsaved-badge">You have unsaved changes</span>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Edit Mode Toolbar</p>
              <p className="um-feature-desc">
                When in edit mode the toolbar replaces the Edit button with <strong>Save</strong>{' '}
                and <strong>Cancel</strong> buttons. If you make any changes an amber
                "You have unsaved changes" badge appears as a reminder. Clicking Cancel
                prompts a confirmation if there are unsaved changes.
              </p>
            </div>
          </div>

          {/* 3. Image Gallery */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo um-gallery-demo">
                <div className="learn-more-gallery" style={{ margin: 0 }}>
                  <button type="button" className="learn-more-gallery-tile learn-more-gallery-tile--primary" style={{ pointerEvents: 'none', minHeight: '120px' }}>
                    <img className="learn-more-gallery-image" src="/CEREO-logo.png" alt="Primary" />
                  </button>
                  <div className="learn-more-gallery-side-grid">
                    {[1, 2, 3, 4].map(i => (
                      <button key={i} type="button" className="learn-more-gallery-tile" style={{ pointerEvents: 'none', minHeight: '55px' }}>
                        <img className="learn-more-gallery-image" src="/CEREO-logo.png" alt={`img ${i}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" className="learn-more-see-all-images-btn" style={{ pointerEvents: 'none', marginTop: '8px' }}>See all 5 images</button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Image Gallery</p>
              <p className="um-feature-desc">
                The top of the Detail View displays images in a two-column gallery: a large
                primary image on the left and up to four smaller thumbnails on the right.
                Click any tile to open the image in a full-screen lightbox. Below the
                gallery, <strong>See all N images</strong> opens a scrollable list of every
                uploaded image.
              </p>
            </div>
          </div>

          {/* 4. All Images view */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo um-all-images-demo">
                <div className="learn-more-all-images-view">
                  <div className="learn-more-all-images-header">
                    <button type="button" className="learn-more-all-images-back-link" style={{ pointerEvents: 'none' }}>← Back to Learn More</button>
                    <p className="learn-more-all-images-count">Showing 3 images</p>
                  </div>
                  <div className="learn-more-all-images-list">
                    <div className="learn-more-all-image-item">
                      <div className="learn-more-all-image-sort-controls">
                        <button type="button" className="learn-more-all-image-sort-btn learn-more-all-image-sort-up" disabled style={{ pointerEvents: 'none' }}>▲</button>
                        <button type="button" className="learn-more-all-image-sort-btn learn-more-all-image-sort-down" style={{ pointerEvents: 'none' }}>▼</button>
                      </div>
                      <button type="button" className="learn-more-all-image-btn" style={{ pointerEvents: 'none' }}>
                        <img className="learn-more-all-image" src="/CEREO-logo.png" alt="Image 1" style={{ maxHeight: '80px' }} />
                      </button>
                      <button type="button" className="learn-more-all-image-select is-selected" style={{ pointerEvents: 'none' }}>
                        <span className="learn-more-all-image-select-mark" />
                      </button>
                    </div>
                  </div>
                  <div className="learn-more-all-images-actions">
                    <button type="button" className="learn-more-all-images-delete-selected-btn" style={{ pointerEvents: 'none' }}>Delete Selected (1)</button>
                    <button type="button" className="learn-more-modal-toolbar-btn save" style={{ pointerEvents: 'none' }}>Add New Image</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">All Images View</p>
              <p className="um-feature-desc">
                The "See all images" view lists every image in full width. In edit mode:
                <br />• <strong>▲ / ▼ sort buttons</strong> reorder images — the order here becomes the gallery order
                <br />• <strong>Select circle</strong> (top-right of each image) toggles selection; turns blue when selected
                <br />• <strong>Delete Selected</strong> removes all selected images at once
                <br />• <strong>Add New Image</strong> uploads an additional image to the card
              </p>
            </div>
          </div>

          {/* 5. Title & Category */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="learn-more-modal-title-section" style={{ margin: 0 }}>
                  <h2 style={{ margin: '0 0 6px' }}>Sample Dataset Title</h2>
                  <p className="learn-more-modal-subtitle" style={{ margin: 0 }}>Watershed</p>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Title &amp; Category</p>
              <p className="um-feature-desc">
                The dataset's full title is displayed in large bold text below the gallery.
                The category label (River, Watershed, Places, Other, or Uncategorized)
                appears in smaller muted text below. In edit mode the title becomes an input
                field and the category becomes a dropdown.
              </p>
            </div>
          </div>

          {/* 6. Info fields — view mode */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo um-fields-demo">
                <div className="learn-more-fields-grid">
                  <p><strong>Author:</strong> Jane Smith</p>
                  <p><strong>Card Creator:</strong> jsmith</p>
                  <p><strong>Email:</strong> j.smith@cereo.edu</p>
                  <p><strong>Funding:</strong> NSF Grant #12345</p>
                  <p><strong>Organization:</strong> CEREO</p>
                  <p className="learn-more-coordinate-readonly">
                    <strong>Latitude:</strong> 46.6
                    <span className="learn-more-coordinate-separator"> | </span>
                    <strong>Longitude:</strong> -120.5
                  </p>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Information Fields</p>
              <p className="um-feature-desc">
                Dataset metadata is laid out in a two-column grid: Author, Card Creator,
                Email, Funding, and Organization. Latitude and Longitude appear together on
                a full-width row. In edit mode each field becomes an editable input; Card
                Creator is read-only and cannot be changed.
              </p>
            </div>
          </div>

          {/* 7. Info fields — edit mode inputs */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo um-fields-demo">
                <div className="learn-more-fields-grid">
                  <div className="learn-more-field-cell">
                    <p><strong>Author:</strong></p>
                    <input className="learn-more-inline-input" type="text" defaultValue="Jane Smith" readOnly style={{ marginBottom: 0 }} />
                  </div>
                  <div className="learn-more-field-cell">
                    <p><strong>Card Creator:</strong></p>
                    <input className="learn-more-inline-input learn-more-inline-readonly" type="text" defaultValue="jsmith" readOnly disabled style={{ marginBottom: 0 }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Edit Mode Inline Inputs</p>
              <p className="um-feature-desc">
                In edit mode each info field becomes an inline text input with a light
                border. The <strong>Card Creator</strong> field has a grey background
                indicating it is read-only. The <strong>Description</strong> field expands
                into a resizable textarea and <strong>Tags</strong> accepts a
                comma-separated string.
              </p>
            </div>
          </div>

          {/* 8. Links — view mode */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="learn-more-links-view">
                  <strong>Links:</strong>
                  <ul className="learn-more-links-list">
                    <li><a href="#um" onClick={e => e.preventDefault()}>CEREO Homepage</a></li>
                    <li><a href="#um" onClick={e => e.preventDefault()}>https://doi.org/10.xxxx/sample</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Links</p>
              <p className="um-feature-desc">
                External URLs are shown as a bulleted list of clickable links. If a display
                text was provided it is shown instead of the raw URL. In edit mode each
                link row has a URL input and an optional display-text input, and multiple
                links can be added with <strong>+ Add More Links</strong>.
              </p>
            </div>
          </div>

          {/* 9. Links — edit mode rows */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ minWidth: '280px' }}>
                <div className="learn-more-link-row">
                  <input className="learn-more-inline-input" type="text" placeholder="URL" defaultValue="https://cereo.wsu.edu" readOnly style={{ marginBottom: 0 }} />
                  <input className="learn-more-inline-input learn-more-link-text-input" type="text" placeholder="Display text (optional)" defaultValue="CEREO" readOnly style={{ marginBottom: 0 }} />
                  <button type="button" className="learn-more-link-remove-btn" style={{ pointerEvents: 'none' }}>×</button>
                </div>
                <button type="button" className="learn-more-modal-toolbar-btn cancel learn-more-add-link-btn" style={{ pointerEvents: 'none' }}>+ Add More Links</button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Link Edit Rows</p>
              <p className="um-feature-desc">
                Each link in edit mode is a pair of inputs: the URL and an optional display
                text. Click <strong>×</strong> to remove that link row. Click{' '}
                <strong>+ Add More Links</strong> to append a new empty row. All link
                changes are saved together when you press Save.
              </p>
            </div>
          </div>

          {/* 10. Downloadable Files */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="file-list learn-more-file-list" style={{ margin: 0, paddingTop: 0, borderTop: 'none' }}>
                  <h3>Downloadable Files:</h3>
                  <ul>
                    <li><a href="#um" onClick={e => e.preventDefault()}>yakima_study_2023.pdf</a></li>
                    <li><a href="#um" onClick={e => e.preventDefault()}>dataset_shapefile.zip</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Downloadable Files</p>
              <p className="um-feature-desc">
                Files attached to a card appear as a list of download links. Click any link
                to download that file directly. In edit mode you can delete existing files
                with the × button next to each filename, and attach new files using the
                file picker; new files are uploaded when you press Save.
              </p>
            </div>
          </div>

          {/* 11. ArcGIS Linked Layers */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo um-arcgis-demo">
                <p style={{ margin: '0 0 6px', fontSize: '0.95rem', color: '#374151' }}><strong>Linked ArcGIS Services/Layers:</strong></p>
                <ul className="learn-more-arcgis-links-list">
                  <li className="learn-more-arcgis-link-item">
                    <label className="learn-more-arcgis-layer-toggle-label">
                      <input type="checkbox" className="learn-more-arcgis-layer-toggle-cb" defaultChecked readOnly />
                    </label>
                    <span className="learn-more-arcgis-link-row">
                      <span className="learn-more-arcgis-row-text">Washington State</span>
                      <span className="learn-more-arcgis-row-sep"> › </span>
                      <span className="learn-more-arcgis-row-text">Hydrology</span>
                      <span className="learn-more-arcgis-row-sep"> › </span>
                      <span className="learn-more-arcgis-row-text learn-more-arcgis-row-name">Streams &amp; Rivers</span>
                    </span>
                    <button type="button" className="learn-more-arcgis-goto-btn" style={{ pointerEvents: 'none' }}>›</button>
                  </li>
                  <li className="learn-more-arcgis-link-item">
                    <label className="learn-more-arcgis-layer-toggle-label">
                      <input type="checkbox" className="learn-more-arcgis-layer-toggle-cb" readOnly />
                    </label>
                    <span className="learn-more-arcgis-link-row">
                      <span className="learn-more-arcgis-row-text">Idaho</span>
                      <span className="learn-more-arcgis-row-sep"> › </span>
                      <span className="learn-more-arcgis-row-text">Boundaries</span>
                      <span className="learn-more-arcgis-row-sep"> › </span>
                      <span className="learn-more-arcgis-row-text learn-more-arcgis-row-name">County Lines</span>
                    </span>
                    <button type="button" className="learn-more-arcgis-goto-btn" style={{ pointerEvents: 'none' }}>›</button>
                  </li>
                </ul>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Linked ArcGIS Layers</p>
              <p className="um-feature-desc">
                Cards can be linked to specific ArcGIS map layers. Each linked item shows a
                breadcrumb path (state › folder › layer name). The <strong>checkbox</strong>{' '}
                on the left toggles that layer's visibility on the map without closing the
                Detail View. The <strong>›</strong> button on the right jumps to that layer
                in the ArcGIS Upload Panel. In edit mode you can remove links or add new
                ones with <strong>+ Add ArcGIS Item</strong>.
              </p>
            </div>
          </div>

          {/* 12. Image Preview lightbox */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo um-image-preview-demo">
                <div style={{ position: 'relative', background: '#111', borderRadius: '6px', overflow: 'hidden', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/CEREO-logo.png" alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  <span style={{ position: 'absolute', top: '6px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', lineHeight: 1 }}>×</span>
                  <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '36px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px' }}>‹</span>
                  <span style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '36px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px' }}>›</span>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', gap: '2px' }}>
                    <span style={{ flex: 1, height: '4px', background: '#fff' }} />
                    <span style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.35)' }} />
                    <span style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.35)' }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Image Preview (Lightbox)</p>
              <p className="um-feature-desc">
                Clicking any gallery tile opens the image in a full-screen dark lightbox.
                Use the <strong>‹ / ›</strong> panels on the left and right edges to
                navigate between images. The progress bar at the bottom shows your position;
                click any segment to jump to that image. Press <strong>×</strong> in the
                top-right corner or click the dark overlay to close the lightbox.
              </p>
            </div>
          </div>

        </div>
      </section>
      )}

      {activeSection === 'arcgis-panel' && (
      <section className="um-section">
        <h2>ArcGIS Upload Panel</h2>
        <p className="um-section-desc">
          The ArcGIS Upload Panel lets you browse and add ArcGIS REST map layers directly
          onto the main map. Open it by clicking the <strong>Layers</strong> button in the
          map toolbar. Services are organized by state (WA / ID / OR), then by folder, then
          by individual service and layer.
        </p>

        {/* ---- Panel shell demo ---- */}
        <div className="um-arcgis-panel-mock">
          <div className="upload-panel-header">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#223244' }}>Browse ArcGIS Services</h3>
            <button className="upload-panel-header-close-btn" style={{ pointerEvents: 'none' }}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div style={{ padding: '6px 10px 8px' }}>
            <div className="upload-panel-searchbar">
              <input type="text" placeholder="Search layers, folders, services..." readOnly />
              <button className="upload-panel-searchbar-btn search" style={{ pointerEvents: 'none' }}>
                <FontAwesomeIcon icon={faSearch} />
              </button>
              <button className="upload-panel-searchbar-btn clear" style={{ pointerEvents: 'none' }}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="upload-panel-opacity-slider-row">
              <label>Layer Opacity:</label>
              <input
                type="range"
                className="upload-panel-opacity-slider"
                defaultValue="70"
                min="0"
                max="100"
                readOnly
                style={{ background: 'linear-gradient(to right, #1976d2 70%, #d0d0d0 70%)' }}
              />
              <span className="upload-panel-opacity-value">70%</span>
            </div>
          </div>
          <div className="upload-panel-folder-area" style={{ maxHeight: '170px', margin: '0 10px 10px' }}>
            <div className="upload-state-folder">
              <FontAwesomeIcon icon={faFolder} style={{ marginRight: '6px', color: '#5a7fa8' }} />
              Washington State ArcGIS Services
            </div>
            <div className="upload-state-folder-content">
              <div className="upload-folder" style={{ margin: '2px 0', pointerEvents: 'none' }}>
                <span>Hydrology</span>
              </div>
              <div className="upload-folder" style={{ margin: '2px 0', pointerEvents: 'none' }}>
                <span>Boundaries</span>
              </div>
            </div>
            <div className="upload-state-folder" style={{ pointerEvents: 'none' }}>
              <FontAwesomeIcon icon={faFolder} style={{ marginRight: '6px', color: '#5a7fa8' }} />
              Idaho ArcGIS Services
            </div>
            <div className="upload-state-folder" style={{ pointerEvents: 'none' }}>
              <FontAwesomeIcon icon={faFolder} style={{ marginRight: '6px', color: '#5a7fa8' }} />
              Oregon ArcGIS Services
            </div>
          </div>
        </div>

        {/* ---- Feature rows ---- */}
        <div className="um-feature-list">

          {/* 1. Opening the Panel */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <button type="button" className="card-toolbar-button" title="Toggle ArcGIS Layers" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faGrip} />
                  <span>Layers</span>
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Opening the Panel</p>
              <p className="um-feature-desc">
                Click the <strong>Layers</strong> button in the map toolbar to open or close
                the ArcGIS Upload Panel. The panel slides in from the left edge of the screen.
                When the card panel is also open, the two panels split the left side vertically.
              </p>
            </div>
          </div>

          {/* 2. Panel Header */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ minWidth: '260px', padding: 0 }}>
                <div className="upload-panel-header" style={{ border: '1px solid #d8e1ea', borderRadius: '6px', padding: '8px 12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#223244' }}>Browse ArcGIS Services</h3>
                  <button className="upload-panel-header-close-btn" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Panel Header</p>
              <p className="um-feature-desc">
                The header displays the panel title and an <strong>×</strong> close button
                to dismiss the panel. Closing the panel does <em>not</em> remove any layers
                already added to the map — they remain visible until you uncheck them.
              </p>
            </div>
          </div>

          {/* 3. Search Bar */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ minWidth: '280px' }}>
                <div className="upload-panel-searchbar">
                  <input type="text" defaultValue="Hydrology" readOnly />
                  <button className="upload-panel-searchbar-btn search" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faSearch} />
                  </button>
                  <button className="upload-panel-searchbar-btn clear" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Service Search Bar</p>
              <p className="um-feature-desc">
                Type a keyword and press <strong>Enter</strong> or click the search button
                to search across all states. The type dropdown (any / folder / service /
                layer) narrows the scope. Click <strong>×</strong> to clear the search and
                return to the full folder tree.
              </p>
              <span className="um-feature-note">
                While a search is active, a result-navigation counter appears with ▲ / ▼ arrows to jump between matches.
              </span>
            </div>
          </div>

          {/* 4. Show Added Only */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="upload-panel-added-checkbox-row">
                  <input type="checkbox" id="um-show-added" defaultChecked readOnly style={{ marginRight: '6px', accentColor: '#1976d2' }} />
                  <label htmlFor="um-show-added" style={{ cursor: 'default', userSelect: 'none', fontSize: '13px', color: '#1976d2' }}>Show added layers only</label>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Show Added Only</p>
              <p className="um-feature-desc">
                When checked, the folder tree collapses to display only services and layers
                that are currently active (checked) on the map. This makes it easy to
                review or remove layers you have already loaded without scrolling through
                the full service tree.
              </p>
            </div>
          </div>

          {/* 5. Layer Opacity */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ minWidth: '240px' }}>
                <div className="upload-panel-opacity-slider-row">
                  <label>Layer Opacity:</label>
                  <input
                    type="range"
                    className="upload-panel-opacity-slider"
                    defaultValue="70"
                    min="0"
                    max="100"
                    readOnly
                    style={{ background: 'linear-gradient(to right, #1976d2 70%, #d0d0d0 70%)' }}
                  />
                  <span className="upload-panel-opacity-value">70%</span>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Layer Opacity</p>
              <p className="um-feature-desc">
                The opacity slider controls the transparency of <em>all</em> ArcGIS layers
                added to the map at once. Drag left for more transparent, right for fully
                opaque. The current percentage is shown beside the slider and updates live
                as you drag.
              </p>
            </div>
          </div>

          {/* 6. Update & Clear Controls */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ gap: '8px' }}>
                <button className="upload-panel-update-btn" title="Update services" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faSync} />
                </button>
                <button type="button" className="card-toolbar-button" title="Clear All Layers" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faTimes} />
                  <span>Clear All</span>
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Update &amp; Clear Controls</p>
              <p className="um-feature-desc">
                The <strong>⟳ sync button</strong> re-fetches the services list from the
                ArcGIS REST servers and updates the database, discovering newly published or
                renamed services. <strong>Clear All Layers</strong> unchecks every active
                layer and removes them all from the map in one click.
              </p>
              <span className="um-feature-note">
                Updating services may take a moment; a progress message is shown while the operation runs.
              </span>
            </div>
          </div>

          {/* 7. Service Tree Hierarchy */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '260px', padding: 0, gap: 0 }}>
                <div className="upload-state-folder" style={{ borderRadius: '4px 4px 0 0' }}>
                  <FontAwesomeIcon icon={faFolder} style={{ marginRight: '6px', color: '#5a7fa8' }} />
                  Washington State ArcGIS Services
                </div>
                <div className="upload-state-folder-content" style={{ paddingBottom: '4px' }}>
                  <div className="upload-folder" style={{ margin: '2px 0', pointerEvents: 'none' }}>
                    <span>
                      <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '10px', marginRight: '6px', color: '#5a7fa8' }} />
                      Hydrology
                    </span>
                  </div>
                  <div style={{ paddingLeft: '16px' }}>
                    <label className="upload-item" style={{ pointerEvents: 'none' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
                        <input type="checkbox" readOnly />
                        WA Streams and Rivers
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Service Tree Hierarchy</p>
              <p className="um-feature-desc">
                Services are organized in a three-level tree:{' '}
                <strong>State</strong> (WA, ID, OR) → <strong>Folder</strong> →{' '}
                <strong>Service / Layer</strong>. Click a state heading to expand or
                collapse all of its folders. Click a folder to drill into it. Click a
                service to expand and show its individual layers.
              </p>
            </div>
          </div>

          {/* 8. Layer Rows & Right-Click Menu */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                {/* Service row */}
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#5c6f82', fontWeight: 600 }}>Right-click a service:</p>
                  <div className="layer-context-menu" style={{ position: 'static', boxShadow: 'none' }}>
                    <button style={{ pointerEvents: 'none' }}>Rename</button>
                    <button style={{ pointerEvents: 'none' }}>Learn More</button>
                    <button style={{ pointerEvents: 'none' }}>Pin (Auto-load)</button>
                  </div>
                </div>
                {/* Layer row */}
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#5c6f82', fontWeight: 600 }}>Right-click a layer:</p>
                  <div className="layer-context-menu" style={{ position: 'static', boxShadow: 'none' }}>
                    <button style={{ pointerEvents: 'none' }}>Learn More</button>
                    <button style={{ pointerEvents: 'none' }}>Pin (Auto-load)</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Layer Rows &amp; Right-Click Menu</p>
              <p className="um-feature-desc">
                Each service or layer is shown as a row with a checkbox and name.
                <strong> Right-click</strong> any row to open a context menu:
                <br />• <strong>Rename</strong> — rename the service (admin only)
                <br />• <strong>Learn More</strong> — open the Service / Layer Info modal with ArcGIS REST metadata
                <br />• <strong>Pin (Auto-load)</strong> — pin the item so it loads automatically every time the panel opens; right-click again and choose <strong>Unpin</strong> to remove it
              </p>
              <span className="um-feature-note">
                You can also click the <strong>three-dot button</strong> on a service row (same as Learn More) to open Service info directly.
              </span>
            </div>
          </div>

          {/* 9. Search Result Navigation */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="panel-nav-mini" style={{ position: 'static' }}>
                  <span className="panel-nav-mini-counter">2 / 7</span>
                  <button className="panel-nav-mini-btn" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faChevronUp} />
                  </button>
                  <button className="panel-nav-mini-btn" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faChevronDown} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Search Result Navigation</p>
              <p className="um-feature-desc">
                When a search returns multiple matches, a floating counter (e.g. "2 / 7")
                appears with <strong>▲ / ▼</strong> arrows to jump between matches. The
                panel automatically scrolls to bring each highlighted match into view.
                "0 results" is shown when nothing matched the keyword.
              </p>
            </div>
          </div>

          {/* 10. Map click popup */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ padding: 0, minWidth: '260px', alignItems: 'stretch' }}>
                <div className="arcgis-popup-wrapper" style={{ border: '1px solid #d0d7e2', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                  <div className="arcgis-popup-header">
                    <h3 style={{ margin: 0, fontSize: '0.95em' }}>WA Rivers and Streams</h3>
                  </div>
                  <div className="arcgis-popup-body" style={{ pointerEvents: 'none', fontSize: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <tbody>
                        {[['GNIS_NAME','Palouse River'],['LENGTHKM','42.3'],['FTYPE','StreamRiver'],['FCODE','46006']].map(([k,v]) => (
                          <tr key={k}>
                            <td style={{ fontWeight: 700, paddingRight: '6px', verticalAlign: 'top', whiteSpace: 'nowrap', color: '#333' }}>{k}</td>
                            <td style={{ wordBreak: 'break-word', color: '#555' }}>{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Map Click Popup (Layer Features)</p>
              <p className="um-feature-desc">
                When a visible ArcGIS layer is active on the map, clicking any feature on it
                opens a Mapbox popup with a property table. The popup header shows the layer
                name; the body lists all feature attributes (e.g. GNIS_NAME, geometry type,
                length). Long descriptions are collapsed with a <strong>Show more</strong>{' '}
                link. Multiple features can be open simultaneously — each new popup is
                stacked offset from the previous one.
              </p>
            </div>
          </div>

          {/* 11. Service / Layer info modal */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ padding: 0, minWidth: '260px', alignItems: 'stretch' }}>
                <div className="um-svcinfo-demo-wrapper">
                  <div className="arcgis-service-info-modal">
                    <div className="arcgis-service-info-modal-header">
                      <strong style={{ fontSize: '13px' }}>Service info</strong>
                      <button type="button" className="arcgis-service-info-modal-close" style={{ pointerEvents: 'none' }}>&times;</button>
                    </div>
                    <div className="arcgis-service-info-modal-content" style={{ pointerEvents: 'none' }}>
                      <div className="arcgis-service-info-row"><strong>Service Description:</strong>
                        <div className="arcgis-service-info-description">WA Dept of Ecology hydrography layer.</div>
                      </div>
                      <div className="arcgis-service-info-row"><strong>Service Item Id:</strong> 8f6b3e4f2a1c</div>
                      <div className="arcgis-service-info-row"><strong>Copyright Text:</strong> © WA Ecology 2024</div>
                      <div className="arcgis-service-info-row"><strong>Spatial Reference:</strong> WKID 4326</div>
                      <div className="arcgis-service-info-row"><strong>Service Opacity:</strong> 70%</div>
                      <div className="arcgis-service-info-row"><strong>Historical View:</strong> Date Range / Timeline</div>
                      <div className="arcgis-service-info-row"><strong>Layers / Sublayers:</strong> clickable layer links</div>
                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #ddd', fontSize: '12px', color: '#1976d2' }}>View ArcGIS Service Page →</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Service / Layer Info Modal</p>
              <p className="um-feature-desc">
                This modal now has a dedicated tab in the manual with complete coverage of
                each internal feature, including service metadata, service opacity,
                historical filters (Date Range and Timeline), Layers / Sublayers links,
                and layer-level metadata fields.
              </p>
              <p className="um-feature-desc" style={{ marginTop: '8px' }}>
                Open the detailed guide here:{' '}
                <button
                  type="button"
                  className="um-inline-link"
                  onClick={() => navTo('service-layer-info')}
                >
                  Service / Layer Info Modal
                </button>
                .
              </p>
            </div>
          </div>

        </div>
      </section>
      )}

      {activeSection === 'service-layer-info' && (
      <section className="um-section um-section--service-layer-info">
        <h2>Service / Layer Info Modal</h2>
        <p className="um-section-desc">
          This tab documents the floating info modal used by the ArcGIS Upload Panel.
          The modal appears on the right side and has two variants: <strong>Service info</strong>
          and <strong>Layer Info</strong>. The content below follows the current implementation
          in ArcGIS Upload Panel code.
        </p>

        <div className="um-feature-list">

          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div className="layer-context-menu" style={{ position: 'static', boxShadow: 'none' }}>
                  <button style={{ pointerEvents: 'none' }}>Learn More</button>
                </div>
                <button className="arcgis-service-row-action-btn" style={{ pointerEvents: 'none' }} title="Learn more">
                  <FontAwesomeIcon icon={faEllipsisV} />
                </button>
                <button className="arcgis-service-info-layer-link" style={{ pointerEvents: 'none' }}>
                  WA Major Rivers (Layer 2)
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">1) Ways to Open the Modal</p>
              <p className="um-feature-desc">
                There are three entry paths:
                <br />• Right-click a service or layer row and choose <strong>Learn More</strong>.
                <br />• Click the service row <strong>three-dot Learn more button</strong>.
                <br />• In Service info, click a <strong>Layers / Sublayers</strong> link to open Layer Info directly.
              </p>
            </div>
          </div>

          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ padding: 0, minWidth: '280px', alignItems: 'stretch' }}>
                <div className="arcgis-service-info-modal" style={{ position: 'static' }}>
                  <div className="arcgis-service-info-modal-header">
                    <strong style={{ fontSize: '13px' }}>Service info</strong>
                    <button type="button" className="arcgis-service-info-modal-close" style={{ pointerEvents: 'none' }}>&times;</button>
                  </div>
                  <div className="arcgis-service-info-modal-content" style={{ pointerEvents: 'none' }}>
                    <div className="arcgis-service-info-row"><strong>Loading state:</strong> Loading service info…</div>
                    <div className="arcgis-service-info-row"><strong>Empty state:</strong> No information available.</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">2) Header, Close, Loading, and Empty States</p>
              <p className="um-feature-desc">
                The header title changes by mode (<strong>Service info</strong> vs <strong>Layer Info: &lt;name&gt;</strong>),
                and the <strong>×</strong> button closes the current modal. While fetching REST metadata,
                loading text is shown. If the endpoint returns no useful data, an empty message
                is displayed and an endpoint link is still provided.
              </p>
            </div>
          </div>

          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ padding: 0, minWidth: '280px', alignItems: 'stretch' }}>
                <div className="arcgis-service-info-modal" style={{ position: 'static' }}>
                  <div className="arcgis-service-info-modal-content" style={{ pointerEvents: 'none' }}>
                    <div className="arcgis-service-info-row"><strong>Service Description:</strong> Hydrography base service.</div>
                    <div className="arcgis-service-info-row"><strong>Service Item Id:</strong> 8f6b3e4f2a1c</div>
                    <div className="arcgis-service-info-row"><strong>Copyright Text:</strong> © WA Ecology 2024</div>
                    <div className="arcgis-service-info-row"><strong>Spatial Reference:</strong> WKID 4326</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">3) Service Metadata Block</p>
              <p className="um-feature-desc">
                Service info normalizes and shows core metadata from ArcGIS REST:
                description/serviceDescription, service item id, copyright text,
                and spatial reference (latest WKID, WKID, or WKT fallback).
              </p>
            </div>
          </div>

          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ minWidth: '280px' }}>
                <div className="arcgis-service-info-row service-info-opacity-row" style={{ width: '100%' }}>
                  <strong>Service Opacity:</strong>
                  <div className="service-info-opacity-controls" style={{ flex: 1 }}>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value="0.7"
                      readOnly
                      className="service-info-opacity-slider"
                      style={{ background: 'linear-gradient(to right, #27425d 70%, #d8e1ea 70%)' }}
                    />
                    <span className="service-info-opacity-value">70%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">4) Per-Service Opacity Control</p>
              <p className="um-feature-desc">
                The <strong>Service Opacity</strong> slider adjusts map opacity only for the active
                service key. Value is tracked per service in modal state and applied live to map layers.
              </p>
            </div>
          </div>

          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '280px', gap: '8px' }}>
                <div className="service-info-time-tabs" style={{ pointerEvents: 'none' }}>
                  <button className="service-info-time-tab active">Date Range</button>
                  <button className="service-info-time-tab">Timeline</button>
                </div>
                <div className="service-info-time-row" style={{ pointerEvents: 'none' }}>
                  <label className="service-info-time-label">From</label>
                  <input type="date" className="service-info-time-input" readOnly />
                  <label className="service-info-time-label">To</label>
                  <input type="date" className="service-info-time-input" readOnly />
                </div>
                <div className="service-info-time-actions" style={{ pointerEvents: 'none' }}>
                  <button className="service-info-time-btn">Apply</button>
                  <button className="service-info-time-btn service-info-time-btn-clear">Clear</button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">5) Historical View: Date Range + Timeline</p>
              <p className="um-feature-desc">
                Historical View contains two tabs:
                <br />• <strong>Date Range</strong>: select From/To dates, Apply to filter, Clear to remove.
                <br />• <strong>Timeline</strong>: year and month sliders with draggable handles.
                <br />When active, the modal shows a time-filter summary line with the current date span.
              </p>
            </div>
          </div>

          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'flex-start', minWidth: '280px', gap: '8px' }}>
                <div className="arcgis-service-info-row" style={{ width: '100%' }}>
                  <strong>Layers / Sublayers:</strong>
                  <div className="arcgis-service-info-layer-links" style={{ marginTop: '6px' }}>
                    <div className="arcgis-service-info-layer-link-row">
                      <button className="arcgis-service-info-layer-link" style={{ pointerEvents: 'none' }}>Hydrology</button>
                    </div>
                    <div className="arcgis-service-info-layer-link-row" style={{ marginLeft: 12 }}>
                      <button className="arcgis-service-info-layer-link" style={{ pointerEvents: 'none' }}>Rivers</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">6) Layers / Sublayers Link Tree</p>
              <p className="um-feature-desc">
                Service info renders a hierarchical layer tree. Clicking a layer link opens
                the corresponding Layer Info modal for that layer id. This is the fastest
                path from service-level metadata to layer-level details.
              </p>
            </div>
          </div>

          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ padding: 0, minWidth: '280px', alignItems: 'stretch' }}>
                <div className="arcgis-service-info-modal" style={{ position: 'static' }}>
                  <div className="arcgis-service-info-modal-header">
                    <strong style={{ fontSize: '13px' }}>Layer Info: WA Rivers</strong>
                    <button type="button" className="arcgis-service-info-modal-close" style={{ pointerEvents: 'none' }}>&times;</button>
                  </div>
                  <div className="arcgis-service-info-modal-content" style={{ pointerEvents: 'none' }}>
                    <div className="arcgis-service-info-row"><strong>Layer Name:</strong> WA Rivers</div>
                    <div className="arcgis-service-info-row"><strong>Geometry Type:</strong> esriGeometryPolyline</div>
                    <div className="arcgis-service-info-row"><strong>Min Scale:</strong> 24,000</div>
                    <div className="arcgis-service-info-row"><strong>Max Scale:</strong> 1,000,000</div>
                    <div className="arcgis-service-info-row"><strong>Default Visibility:</strong> Visible</div>
                    <div className="arcgis-service-info-row"><strong>Has Attachments:</strong> No</div>
                    <div className="arcgis-service-info-row"><strong>Fields:</strong> 18 field(s)</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">7) Layer Info Fields (Detailed)</p>
              <p className="um-feature-desc">
                Layer Info includes all available layer-level fields from REST metadata:
                description, layer name, geometry type, copyright text,
                min/max scale, default visibility, attachment support,
                and fields summary (count + first few field names).
              </p>
            </div>
          </div>

          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: '#1976d2' }}>View ArcGIS Service Page →</div>
                <div style={{ fontSize: '12px', color: '#1976d2' }}>View ArcGIS Layer Page →</div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">8) Endpoint Links and Data Source Verification</p>
              <p className="um-feature-desc">
                Both modal types provide direct links to the corresponding ArcGIS REST pages.
                Use these links to verify source metadata, inspect native JSON responses,
                and cross-check map behavior against upstream service/layer definitions.
              </p>
            </div>
          </div>

        </div>
      </section>
      )}

      {activeSection === 'custom-layers' && (
      <section className="um-section">
        <h2>Custom Layers Panel</h2>
        <p className="um-section-desc">
          The Custom Layers Panel is your personal library of saved ArcGIS services. Add
          services here from the ArcGIS Upload Panel, organize them into folders, reorder
          them by dragging, and pin items to auto-load every time you open the panel. Login
          is required to use this panel.
        </p>

        {/* ---- Panel shell demo ---- */}
        <div className="um-arcgis-panel-mock">
          <div className="custom-layers-panel-header" style={{ padding: '10px 12px 8px', borderBottom: '1px solid #d8e1ea' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#223244', flex: 1 }}>Custom Layers</h3>
            <button className="custom-layers-panel-new-folder-btn" style={{ pointerEvents: 'none' }} title="New Folder">
              <FontAwesomeIcon icon={faFolderPlus} />
            </button>
            <button className="custom-layers-panel-close-btn" style={{ pointerEvents: 'none' }}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div style={{ padding: '6px 10px 8px' }}>
            <div className="upload-panel-searchbar">
              <input type="text" placeholder="Search folders, services, or layers…" readOnly />
              <select className="upload-panel-searchbar-dropdown" defaultValue="any" style={{ pointerEvents: 'none' }}>
                <option value="any">Any</option>
              </select>
              <button className="upload-panel-searchbar-btn search" style={{ pointerEvents: 'none' }}>
                <FontAwesomeIcon icon={faSearch} />
              </button>
              <button className="upload-panel-searchbar-btn clear" style={{ pointerEvents: 'none' }}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
          <div className="upload-panel-folder-area" style={{ maxHeight: '160px', margin: '0 10px 10px' }}>
            <div className="custom-layers-folder">
              <FontAwesomeIcon icon={faFolder} style={{ color: '#5a7fa8', fontSize: '12px' }} />
              My Hydrology Layers
            </div>
            <div className="custom-layers-folder-content">
              <div className="custom-layers-item" style={{ pointerEvents: 'none' }}>
                <input type="checkbox" defaultChecked readOnly style={{ marginRight: '4px', accentColor: '#1976d2' }} />
                <span className="custom-layers-item-label">WA Streams and Rivers</span>
              </div>
              <div className="custom-layers-item" style={{ pointerEvents: 'none' }}>
                <input type="checkbox" readOnly style={{ marginRight: '4px' }} />
                <span className="custom-layers-item-label">Watershed Boundaries</span>
              </div>
            </div>
            <div className="custom-layers-folder" style={{ pointerEvents: 'none' }}>
              <FontAwesomeIcon icon={faFolder} style={{ color: '#5a7fa8', fontSize: '12px' }} />
              Boundaries
            </div>
          </div>
        </div>

        {/* ---- Feature rows ---- */}
        <div className="um-feature-list">

          {/* 1. Opening the Panel */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <button type="button" className="card-toolbar-button" title="Custom Layers" style={{ pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faFolderPlus} />
                  <span>Custom Layers</span>
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Opening the Panel</p>
              <p className="um-feature-desc">
                Click the <strong>Custom Layers</strong> button in the map toolbar to open
                or close the panel. You must be logged in; a login prompt appears otherwise.
                When the ArcGIS Upload Panel is also open, the two panels share the left
                side vertically.
              </p>
            </div>
          </div>

          {/* 2. Panel Header */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ padding: 0, minWidth: '260px' }}>
                <div className="custom-layers-panel-header" style={{ border: '1px solid #d8e1ea', borderRadius: '6px', padding: '8px 12px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#223244', flex: 1 }}>Custom Layers</h3>
                  <button className="custom-layers-panel-new-folder-btn" style={{ pointerEvents: 'none' }} title="New Folder">
                    <FontAwesomeIcon icon={faFolderPlus} />
                  </button>
                  <button className="custom-layers-panel-close-btn" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Panel Header</p>
              <p className="um-feature-desc">
                The header shows the panel title, a <strong>New Folder</strong>{' '}
                <FontAwesomeIcon icon={faFolderPlus} style={{ fontSize: '12px' }} /> button
                to create a custom folder, and an <strong>×</strong> close button. Closing
                the panel does not remove layers already added to the map.
              </p>
            </div>
          </div>

          {/* 3. Search Bar */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ minWidth: '280px' }}>
                <div className="upload-panel-searchbar">
                  <input type="text" defaultValue="streams" readOnly />
                  <select className="upload-panel-searchbar-dropdown" defaultValue="layer" style={{ pointerEvents: 'none' }}>
                    <option value="layer">Layer</option>
                  </select>
                  <button className="upload-panel-searchbar-btn search" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faSearch} />
                  </button>
                  <button className="upload-panel-searchbar-btn clear" style={{ pointerEvents: 'none' }}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Search Bar</p>
              <p className="um-feature-desc">
                Search across all your custom services and folders. The type dropdown
                narrows results to <strong>Any</strong>, <strong>Folder</strong>,{' '}
                <strong>Service</strong>, or <strong>Layer</strong>. Navigation arrows
                appear when there are multiple matches.
              </p>
            </div>
          </div>

          {/* 4. Layer Opacity */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ minWidth: '240px' }}>
                <div className="upload-panel-opacity-slider-row">
                  <label>Layer Opacity:</label>
                  <input
                    type="range"
                    className="upload-panel-opacity-slider"
                    defaultValue="70"
                    min="0"
                    max="100"
                    readOnly
                    style={{ background: 'linear-gradient(to right, #1976d2 70%, #d0d0d0 70%)' }}
                  />
                  <span className="upload-panel-opacity-value">70%</span>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Layer Opacity</p>
              <p className="um-feature-desc">
                Drag the slider to adjust the transparency of all custom layers on the map
                simultaneously. The percentage updates live as you drag.
              </p>
            </div>
          </div>

          {/* 5. Show Added / Clear All */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <div className="upload-panel-added-checkbox-row">
                  <input type="checkbox" id="um-cl-show-added" defaultChecked readOnly style={{ marginRight: '6px', accentColor: '#1976d2' }} />
                  <label htmlFor="um-cl-show-added" style={{ cursor: 'default', userSelect: 'none', fontSize: '13px', color: '#1976d2' }}>Show only services added to map</label>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Show Added Only &amp; Clear All</p>
              <p className="um-feature-desc">
                <strong>Show only services added to map</strong> collapses the list to
                display only services with at least one active layer. <strong>Clear
                All Layers</strong> (below the checkbox) unchecks every active layer in
                one click. Both controls work the same as in the ArcGIS Upload Panel.
              </p>
            </div>
          </div>

          {/* 6. Folder Structure */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '260px', padding: 0, gap: 0 }}>
                <div className="custom-layers-folder" style={{ borderRadius: '4px 4px 0 0' }}>
                  <FontAwesomeIcon icon={faFolder} style={{ color: '#5a7fa8', fontSize: '12px' }} />
                  My Hydrology Layers
                </div>
                <div className="custom-layers-folder-content" style={{ paddingBottom: '4px' }}>
                  <div className="custom-layers-item" style={{ pointerEvents: 'none' }}>
                    <input type="checkbox" defaultChecked readOnly style={{ marginRight: '4px', accentColor: '#1976d2' }} />
                    <span className="custom-layers-item-label">WA Streams and Rivers</span>
                  </div>
                </div>
                <div className="custom-layers-folder" style={{ borderRadius: '0 0 4px 4px', borderBottom: '1px solid #d8e1ea', pointerEvents: 'none' }}>
                  <FontAwesomeIcon icon={faFolder} style={{ color: '#5a7fa8', fontSize: '12px' }} />
                  Boundaries
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Folder Structure</p>
              <p className="um-feature-desc">
                Services are grouped inside user-created folders. Click a folder to navigate
                into it (file-explorer style). A breadcrumb bar at the top shows your
                current path and lets you navigate back. Folders can be nested inside other
                folders by dragging one folder onto another.
              </p>
            </div>
          </div>

          {/* 7. Drag-and-Drop Reordering */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', minWidth: '260px', padding: 0, gap: '3px' }}>
                <div className="custom-layers-item" style={{ background: '#e3eef9', borderRadius: '4px', cursor: 'grab' }}>
                  <span style={{ fontSize: '11px', color: '#5c6f82', marginRight: '6px' }}>⠿</span>
                  <input type="checkbox" defaultChecked readOnly style={{ marginRight: '4px', accentColor: '#1976d2' }} />
                  <span className="custom-layers-item-label" style={{ fontSize: '12px' }}>WA Streams and Rivers</span>
                </div>
                <div className="custom-layers-item" style={{ borderRadius: '4px', cursor: 'grab' }}>
                  <span style={{ fontSize: '11px', color: '#5c6f82', marginRight: '6px' }}>⠿</span>
                  <input type="checkbox" readOnly style={{ marginRight: '4px' }} />
                  <span className="custom-layers-item-label" style={{ fontSize: '12px' }}>Watershed Boundaries</span>
                </div>
                <div className="custom-layers-item" style={{ borderRadius: '4px', cursor: 'grab', opacity: 0.5, border: '2px dashed #bfd0e2' }}>
                  <span style={{ fontSize: '11px', color: '#5c6f82', marginRight: '6px' }}>⠿</span>
                  <input type="checkbox" readOnly style={{ marginRight: '4px' }} />
                  <span className="custom-layers-item-label" style={{ fontSize: '12px' }}>County Lines</span>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Drag-and-Drop Reordering</p>
              <p className="um-feature-desc">
                Drag any service row to reorder it within its folder. Drag a service onto a
                folder header to move it into that folder. Drag a folder onto another folder
                to nest it. Drag a layer row (when a service is expanded) to reorder layers
                within that service. All changes are saved to the database automatically.
              </p>
            </div>
          </div>

          {/* 8. Right-Click Menu */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#5c6f82', fontWeight: 600 }}>Right-click a service:</p>
                  <div className="layer-context-menu" style={{ position: 'static', boxShadow: 'none' }}>
                    <button style={{ pointerEvents: 'none' }}>Rename</button>
                    <button style={{ pointerEvents: 'none' }}>Learn More</button>
                    <button style={{ pointerEvents: 'none' }}>Remove from Custom Layers</button>
                    <button style={{ pointerEvents: 'none' }}>Pin (Auto-load)</button>
                  </div>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#5c6f82', fontWeight: 600 }}>Right-click a folder:</p>
                  <div className="layer-context-menu" style={{ position: 'static', boxShadow: 'none' }}>
                    <button style={{ pointerEvents: 'none' }}>Rename</button>
                    <button style={{ pointerEvents: 'none' }}>Delete Folder</button>
                  </div>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#5c6f82', fontWeight: 600 }}>Right-click a layer:</p>
                  <div className="layer-context-menu" style={{ position: 'static', boxShadow: 'none' }}>
                    <button style={{ pointerEvents: 'none' }}>Learn More</button>
                    <button style={{ pointerEvents: 'none' }}>Pin (Auto-load)</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Right-Click Menu</p>
              <p className="um-feature-desc">
                Right-click any row to open a context menu:
                <br />• <strong>Rename</strong> — rename a service or folder
                <br />• <strong>Learn More</strong> — view metadata from the ArcGIS REST endpoint
                <br />• <strong>Remove from Custom Layers</strong> — permanently delete the service from your library and unload it from the map
                <br />• <strong>Delete Folder</strong> — delete the folder (services inside are moved to Root)
                <br />• <strong>Pin (Auto-load)</strong> — auto-load the item every time the panel opens; right-click again to Unpin
              </p>
            </div>
          </div>

          {/* 9. Adding Layers from Upload Panel */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="layer-context-menu" style={{ position: 'static', boxShadow: 'none' }}>
                  <button style={{ pointerEvents: 'none' }}>Rename</button>
                  <button style={{ pointerEvents: 'none' }}>Learn More</button>
                  <button style={{ pointerEvents: 'none', fontWeight: 700, color: '#1a6b2a !important' }}>Save to Custom Layers</button>
                  <button style={{ pointerEvents: 'none' }}>Pin (Auto-load)</button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Adding Layers from the Upload Panel</p>
              <p className="um-feature-desc">
                In the ArcGIS Upload Panel, right-click any service row and choose{' '}
                <strong>Save to Custom Layers</strong>. This copies the service into your
                Custom Layers library where you can organize it into folders and reorder it
                at will. The original service in the Upload Panel is unaffected.
              </p>
              <span className="um-feature-note">
                You must be logged in to save layers. A login prompt will appear if you are not.
              </span>
            </div>
          </div>

        </div>
      </section>
      )}

      {activeSection === 'basemap-panel' && (
      <section className="um-section">
        <h2>Basemap Panel</h2>
        <p className="um-section-desc">
          The Basemap Panel lets you switch between six Mapbox map styles directly from the
          map view. Click the map icon on the left sidebar to open or close it. Switching
          styles preserves all custom ArcGIS layers, the current camera position, zoom,
          bearing, and pitch.
        </p>

        {/* ---- Overview demo ---- */}
        <div className="um-basemap-demo-wrapper">
          <div className="basemap-switcher-header">
            <span className="basemap-switcher-title">Map Style</span>
            <button className="basemap-switcher-close" style={{ pointerEvents: 'none' }}>✕</button>
          </div>
          <div className="basemap-switcher-list" style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {[
              { id: 'streets-v12',         label: 'streets-v12',         bg: '#c8d8e8', active: true },
              { id: 'outdoors-v12',        label: 'outdoors-v12',        bg: '#c3d9be' },
              { id: 'satellite-v9',        label: 'satellite-v9',        bg: '#3a4a3a' },
              { id: 'satellite-streets-v12', label: 'satellite-streets-v12', bg: '#4a5a4a' },
              { id: 'navigation-day-v1',   label: 'navigation-day-v1',   bg: '#dce8f2' },
              { id: 'navigation-night-v1', label: 'navigation-night-v1', bg: '#1e2433' },
            ].map(bm => (
              <div
                key={bm.id}
                className={`basemap-switcher-item${bm.active ? ' basemap-switcher-item--active' : ''}`}
                style={{ pointerEvents: 'none' }}
              >
                <div
                  className="basemap-switcher-thumb"
                  style={{ background: bm.bg }}
                />
                <span className="basemap-switcher-label">{bm.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Feature rows ---- */}
        <div className="um-feature-list">

          {/* 1. Opening */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <button
                  type="button"
                  style={{
                    pointerEvents: 'none', background: '#fff', border: '1px solid #ccc',
                    borderRadius: '6px', padding: '8px 14px', fontSize: '14px',
                    color: '#1976d2', display: 'flex', alignItems: 'center', gap: '8px',
                    cursor: 'default',
                  }}
                >
                  <FontAwesomeIcon icon={faMap} />
                  <span>Change Basemap</span>
                </button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Opening the Panel</p>
              <p className="um-feature-desc">
                Click the <strong>map icon</strong> on the left sidebar to toggle the
                Basemap Panel. Click it again, or press the <strong>✕</strong> in the panel
                header, to close it.
              </p>
            </div>
          </div>

          {/* 2. Six styles */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 0, minWidth: '240px' }}>
                {[
                  { label: 'streets-v12',  bg: '#c8d8e8' },
                  { label: 'outdoors-v12', bg: '#c3d9be' },
                  { label: 'satellite-v9', bg: '#3a4a3a' },
                ].map(bm => (
                  <div key={bm.label} className="basemap-switcher-item" style={{ pointerEvents: 'none' }}>
                    <div style={{ width: '72px', height: '48px', borderRadius: '4px', border: '1px solid #ddd', background: bm.bg, flexShrink: 0 }} />
                    <span className="basemap-switcher-label">{bm.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Six Built-in Styles</p>
              <p className="um-feature-desc">
                The panel lists six Mapbox basemap styles:{' '}
                <em>streets-v12</em>, <em>outdoors-v12</em>, <em>satellite-v9</em>,{' '}
                <em>satellite-streets-v12</em>, <em>navigation-day-v1</em>, and{' '}
                <em>navigation-night-v1</em>. Each entry shows a color preview thumbnail
                and the style name.
              </p>
            </div>
          </div>

          {/* 3. Active selection */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 0, minWidth: '240px' }}>
                <div className="basemap-switcher-item" style={{ pointerEvents: 'none', opacity: 0.55 }}>
                  <div style={{ width: '72px', height: '48px', borderRadius: '4px', border: '1px solid #ddd', background: '#c8d8e8', flexShrink: 0 }} />
                  <span className="basemap-switcher-label">streets-v12</span>
                </div>
                <div className="basemap-switcher-item basemap-switcher-item--active" style={{ pointerEvents: 'none' }}>
                  <div style={{ width: '72px', height: '48px', borderRadius: '4px', border: '1px solid #ddd', background: '#c3d9be', flexShrink: 0 }} />
                  <span className="basemap-switcher-label">outdoors-v12</span>
                </div>
                <div className="basemap-switcher-item" style={{ pointerEvents: 'none', opacity: 0.55 }}>
                  <div style={{ width: '72px', height: '48px', borderRadius: '4px', border: '1px solid #ddd', background: '#3a4a3a', flexShrink: 0 }} />
                  <span className="basemap-switcher-label">satellite-v9</span>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Active Style Indicator</p>
              <p className="um-feature-desc">
                The currently active style is highlighted with a light-blue background and a
                blue left border. Clicking any other style immediately applies it to the map
                without a page reload.
              </p>
            </div>
          </div>

          {/* 4. Layer & state preservation */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', gap: '8px', minWidth: '190px' }}>
                {[
                  'ArcGIS layers preserved',
                  'Zoom & position kept',
                  'Bearing & pitch restored',
                ].map(txt => (
                  <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2a6b2a' }}>
                    <span style={{ fontSize: '15px', lineHeight: 1 }}>✓</span>
                    {txt}
                  </div>
                ))}
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Layer &amp; State Preservation</p>
              <p className="um-feature-desc">
                When you switch styles, the map automatically saves your camera position
                (center, zoom, bearing, pitch) and all active custom ArcGIS layers, then
                restores them once the new style finishes loading.
              </p>
            </div>
          </div>

        </div>
      </section>
      )}

      {activeSection === 'map-controls' && (
      <section className="um-section">
        <h2>Map Controls</h2>
        <p className="um-section-desc">
          The map canvas has two groups of controls: a vertical stack in the
          <strong> top-left</strong> and a vertical stack in the <strong>top-right</strong>.
          Together they provide search, fullscreen, zoom, compass, location, drawing, card
          creation shortcuts, and utility tools. View/navigation controls are available to
          everyone; card-creation shortcuts require login.
        </p>

        {/* ---- overview layout ---- */}
        <div className="um-mapctrl-overview">
          <div className="um-mapctrl-corner um-mapctrl-tl">
            <div className="um-mapctrl-label">Top-left</div>
            <div className="um-mapctrl-geocoder-mock">
              <FontAwesomeIcon icon={faSearch} style={{ color: '#aaa', marginRight: 6 }} />
              <span style={{ color: '#aaa', fontSize: '12px' }}>Address or LAT, LONG</span>
            </div>
            <div className="um-mapctrl-group">
              <button className="um-mapctrl-btn" title="Enter Fullscreen"><FontAwesomeIcon icon={faExpand} /></button>
            </div>
            <div className="um-mapctrl-group">
              <button className="um-mapctrl-btn" title="Zoom In"><strong>+</strong></button>
              <button className="um-mapctrl-btn um-mapctrl-btn--sep" title="Zoom Out"><strong>−</strong></button>
              <button className="um-mapctrl-btn um-mapctrl-btn--sep" title="Reset Bearing / Compass">
                <FontAwesomeIcon icon={faRotate} style={{ fontSize: '13px' }} />
              </button>
            </div>
            <div className="um-mapctrl-group">
              <button className="um-mapctrl-btn" title="Geolocate"><FontAwesomeIcon icon={faLocationCrosshairs} /></button>
            </div>
          </div>

          <div className="um-mapctrl-corner um-mapctrl-tr">
            <div className="um-mapctrl-label">Top-right</div>
            <div className="um-mapctrl-group">
              <button className="um-mapctrl-btn" title="Add single point card"><FontAwesomeIcon icon={faLocationDot} /></button>
              <button className="um-mapctrl-btn um-mapctrl-btn--sep" title="Draw Polygon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="m15 12.3v-4.6c.6-.3 1-1 1-1.7 0-1.1-.9-2-2-2-.7 0-1.4.4-1.7 1h-4.6c-.3-.6-1-1-1.7-1-1.1 0-2 .9-2 2 0 .7.4 1.4 1 1.7v4.6c-.6.3-1 1-1 1.7 0 1.1.9 2 2 2 .7 0 1.4-.4 1.7-1h4.6c.3.6 1 1 1.7 1 1.1 0 2-.9 2-2 0-.7-.4-1.4-1-1.7zm-8-.3v-4l1-1h4l1 1v4l-1 1h-4z"/></svg>
              </button>
              <button className="um-mapctrl-btn um-mapctrl-btn--sep" title="Add PNG image to map"><FontAwesomeIcon icon={faImage} /></button>
              <button className="um-mapctrl-btn um-mapctrl-btn--sep" title="Toggle Markers"><FontAwesomeIcon icon={faEye} /></button>
              <button className="um-mapctrl-btn um-mapctrl-btn--sep" title="Reset View">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6.5"/><line x1="8" y1="1.5" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="14.5"/><line x1="1.5" y1="8" x2="4" y2="8"/><line x1="12" y1="8" x2="14.5" y2="8"/><circle cx="8" cy="8" r="2"/>
                </svg>
              </button>
              <button className="um-mapctrl-btn um-mapctrl-btn--sep" title="Screenshot"><FontAwesomeIcon icon={faCamera} /></button>
            </div>
          </div>
        </div>

        {/* ---- feature rows ---- */}
        <div className="um-feature-list">

          {/* 1. Geocoder search */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="um-mapctrl-geocoder-mock" style={{ minWidth: '220px' }}>
                  <FontAwesomeIcon icon={faSearch} style={{ color: '#aaa', marginRight: 6 }} />
                  <span style={{ color: '#aaa', fontSize: '12px' }}>Address or LAT, LONG</span>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Search / Geocoder</p>
              <p className="um-feature-desc">
                Type an address, place name, or <em>lat, lng</em> coordinates to fly the map
                to that location. Results are highlighted with a green marker. After selecting
                a result the visible card list is filtered to the new viewport bounds.
              </p>
            </div>
          </div>

          {/* 2. Fullscreen */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ gap: '6px' }}>
                <div className="um-mapctrl-group">
                  <button className="um-mapctrl-btn" style={{ pointerEvents: 'none' }} title="Enter Fullscreen">
                    <FontAwesomeIcon icon={faExpand} />
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: '#888' }}>→</span>
                <div className="um-mapctrl-group">
                  <button className="um-mapctrl-btn" style={{ pointerEvents: 'none' }} title="Exit Fullscreen">
                    <FontAwesomeIcon icon={faCompress} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Fullscreen Toggle</p>
              <p className="um-feature-desc">
                Click the expand icon to enter browser fullscreen mode; the icon changes to
                a compress icon. Click again (or press <kbd>Esc</kbd>) to exit.
              </p>
            </div>
          </div>

          {/* 3. Zoom & compass */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="um-mapctrl-group" style={{ pointerEvents: 'none' }}>
                  <button className="um-mapctrl-btn" title="Zoom In"><strong>+</strong></button>
                  <button className="um-mapctrl-btn um-mapctrl-btn--sep" title="Zoom Out"><strong>−</strong></button>
                  <button className="um-mapctrl-btn um-mapctrl-btn--sep" title="Reset Bearing">
                    <FontAwesomeIcon icon={faRotate} style={{ fontSize: '13px' }} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Zoom In / Out &amp; Compass</p>
              <p className="um-feature-desc">
                <strong>+</strong> and <strong>−</strong> adjust the map zoom level. The
                compass/rotate button resets the map bearing to north when you have panned
                the rotation. You can also scroll the mouse wheel to zoom or drag to rotate.
              </p>
            </div>
          </div>

          {/* 4. Geolocate */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="um-mapctrl-group" style={{ pointerEvents: 'none' }}>
                  <button className="um-mapctrl-btn" title="Geolocate">
                    <FontAwesomeIcon icon={faLocationCrosshairs} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Geolocate (Current Location)</p>
              <p className="um-feature-desc">
                Click to fly to your current GPS position and optionally track it. Your
                heading is shown as an arrow when the device supports it. Requires browser
                location permission.
              </p>
            </div>
          </div>

          {/* 5. Add single-point card */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="um-mapctrl-group" style={{ pointerEvents: 'none' }}>
                  <button className="um-mapctrl-btn" title="Add single point card">
                    <FontAwesomeIcon icon={faLocationDot} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Single Point Card Shortcut</p>
              <p className="um-feature-desc">
                Opens the Add Card form and immediately starts the <strong>Select a Location</strong>{' '}
                flow for <strong>Single Point</strong>. Click a point on the map and confirm to
                prefill latitude/longitude in the form.
              </p>
            </div>
          </div>

          {/* 6. Draw polygon */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="um-mapctrl-group" style={{ pointerEvents: 'none' }}>
                  <button className="um-mapctrl-btn" title="Draw Polygon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="m15 12.3v-4.6c.6-.3 1-1 1-1.7 0-1.1-.9-2-2-2-.7 0-1.4.4-1.7 1h-4.6c-.3-.6-1-1-1.7-1-1.1 0-2 .9-2 2 0 .7.4 1.4 1 1.7v4.6c-.6.3-1 1-1 1.7 0 1.1.9 2 2 2 .7 0 1.4-.4 1.7-1h4.6c.3.6 1 1 1.7 1 1.1 0 2-.9 2-2 0-.7-.4-1.4-1-1.7zm-8-.3v-4l1-1h4l1 1v4l-1 1h-4z"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Polygon Card Shortcut</p>
              <p className="um-feature-desc">
                Opens the Draw Polygon panel to place a polygon area, then opens Add Card
                with polygon coordinates prefilled. Use this when creating area-based cards.
              </p>
              <p className="um-feature-desc" style={{ marginTop: '8px' }}>
                For all drawing tools, shape presets, style options, and transform modes, see the{' '}
                <button type="button" className="um-inline-link" onClick={() => navTo('polygon-draw')}>
                  Draw Polygon Panel
                </button>{' '}tab.
              </p>
            </div>
          </div>

          {/* 7. Add image-overlay card */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="um-mapctrl-group" style={{ pointerEvents: 'none' }}>
                  <button className="um-mapctrl-btn" title="Add PNG image to map">
                    <FontAwesomeIcon icon={faImage} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Image Overlay Card Shortcut</p>
              <p className="um-feature-desc">
                Opens a PNG picker and placement flow on the map, then opens Add Card in
                <strong>Image Overlay</strong> mode. The placed image supports move/rotate/resize
                before saving and uses four corner vertices.
              </p>
            </div>
          </div>

          {/* 8. Toggle markers */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ gap: '10px' }}>
                <div className="um-mapctrl-group" style={{ pointerEvents: 'none' }}>
                  <button className="um-mapctrl-btn" title="Markers visible (active)">
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                </div>
                <span style={{ fontSize: '11px', color: '#888' }}>↔</span>
                <div className="um-mapctrl-group" style={{ pointerEvents: 'none', opacity: 0.45 }}>
                  <button className="um-mapctrl-btn" title="Markers hidden">
                    <FontAwesomeIcon icon={faEyeSlash} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Toggle Markers &amp; Polygons Visibility</p>
              <p className="um-feature-desc">
                Click the eye icon to hide all card markers and polygon overlays on the map.
                Click again to show them. The icon dims when markers are hidden.
                This is useful for viewing the base map or ArcGIS layers without clutter.
              </p>
            </div>
          </div>

          {/* 9. Reset view */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="um-mapctrl-group" style={{ pointerEvents: 'none' }}>
                  <button className="um-mapctrl-btn" title="Reset Map View">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="8" r="6.5"/><line x1="8" y1="1.5" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="14.5"/><line x1="1.5" y1="8" x2="4" y2="8"/><line x1="12" y1="8" x2="14.5" y2="8"/><circle cx="8" cy="8" r="2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Reset Map View</p>
              <p className="um-feature-desc">
                Flies the map back to the default Pacific Northwest overview (centered near
                Washington State, zoom&nbsp;5.5). Useful after panning or zooming far away.
              </p>
            </div>
          </div>

          {/* 10. Screenshot */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo">
                <div className="um-mapctrl-group" style={{ pointerEvents: 'none' }}>
                  <button className="um-mapctrl-btn" title="Screenshot Map">
                    <FontAwesomeIcon icon={faCamera} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Screenshot Map</p>
              <p className="um-feature-desc">
                Captures the current map canvas (excluding control overlays) as a PNG and
                downloads it automatically. File name includes a timestamp.
              </p>
            </div>
          </div>

        </div>
      </section>
      )}

      {activeSection === 'polygon-draw' && (
      <section className="um-section">
        <h2>Draw Polygon Panel</h2>
        <p className="um-section-desc">
          The Draw Polygon Panel appears on the map after you click the polygon tool in the
          top-right control group. It lets you place vertices by clicking the map, then
          style, transform, and save the shape to use as a spatial filter — cards whose
          markers fall inside the polygon are shown; all others are hidden.
        </p>

        {/* ---- Overview demo ---- */}
        <div className="um-polydraw-demo-wrapper">
          {/* Header */}
          <div className="polygon-draw-modal-header">
            <h3>Draw Polygon</h3>
            <span className="polygon-draw-modal-hint">Click on the map to add points</span>
          </div>

          {/* Style toolbar */}
          <div className="polygon-draw-style-toolbar" style={{ pointerEvents: 'none' }}>
            {/* Line style */}
            <div className="polygon-draw-style-btn-wrap">
              <button type="button" className="polygon-draw-style-btn" title="Line Style">
                <svg width="18" height="10" viewBox="0 0 18 10"><line x1="0" y1="5" x2="18" y2="5" stroke="currentColor" strokeWidth="2"/></svg>
              </button>
            </div>
            {/* Curve mode */}
            <div className="polygon-draw-style-btn-wrap">
              <button type="button" className="polygon-draw-style-btn" title="Curve Mode">
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1,10 C5,1.5 13,1.5 17,10"/></svg>
              </button>
            </div>
            {/* Fill color */}
            <div className="polygon-draw-style-btn-wrap">
              <button type="button" className="polygon-draw-style-btn" title="Fill Color">
                <FontAwesomeIcon icon={faPalette} style={{ fontSize: 14, width: 16, height: 16 }} />
              </button>
            </div>
            {/* Opacity */}
            <div className="polygon-draw-style-btn-wrap">
              <button type="button" className="polygon-draw-style-btn" title="Fill Opacity">
                <span className="polygon-draw-opacity-swatch" style={{ opacity: 0.65 }} />
              </button>
            </div>
            {/* Shapes */}
            <div className="polygon-draw-style-btn-wrap">
              <button type="button" className="polygon-draw-style-btn" title="Shape Presets">
                <FontAwesomeIcon icon={faShapes} style={{ fontSize: 14, width: 16, height: 16 }} />
              </button>
            </div>
            {/* Move */}
            <div className="polygon-draw-style-btn-wrap">
              <button type="button" className="polygon-draw-style-btn" title="Move Polygon">
                <FontAwesomeIcon icon={faHand} style={{ fontSize: 16, width: 16, height: 16 }} />
              </button>
            </div>
            {/* Rotate */}
            <div className="polygon-draw-style-btn-wrap">
              <button type="button" className="polygon-draw-style-btn" title="Rotate Polygon">
                <FontAwesomeIcon icon={faRotate} style={{ fontSize: 16, width: 16, height: 16 }} />
              </button>
            </div>
            {/* Resize */}
            <div className="polygon-draw-style-btn-wrap">
              <button type="button" className="polygon-draw-style-btn" title="Resize Polygon">
                <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} style={{ fontSize: 14, width: 16, height: 16 }} />
              </button>
            </div>
            {/* Undo */}
            <div className="polygon-draw-style-btn-wrap">
              <button type="button" className="polygon-draw-style-btn" title="Undo">
                <FontAwesomeIcon icon={faRotateLeft} style={{ fontSize: 14, width: 16, height: 16 }} />
              </button>
            </div>
            {/* Redo */}
            <div className="polygon-draw-style-btn-wrap">
              <button type="button" className="polygon-draw-style-btn" title="Redo">
                <FontAwesomeIcon icon={faRotateRight} style={{ fontSize: 14, width: 16, height: 16 }} />
              </button>
            </div>
            {/* Clear */}
            <div className="polygon-draw-style-btn-wrap">
              <button type="button" className="polygon-draw-style-btn polygon-draw-clear-btn" title="Clear All">
                <FontAwesomeIcon icon={faTrash} style={{ fontSize: 13, width: 15, height: 15 }} />
              </button>
            </div>
          </div>

          {/* Vertex list */}
          <div className="polygon-draw-modal-vertices" style={{ pointerEvents: 'none' }}>
            {[{ lat: '47.6062', lng: '-122.3321' }, { lat: '47.5112', lng: '-122.2572' }, { lat: '47.4829', lng: '-122.4194' }].map((v, i) => (
              <div key={i} className="polygon-draw-modal-vertex-row">
                <span className="polygon-draw-modal-vertex-num">{i + 1}</span>
                <div className="polygon-draw-modal-vertex-coords polygon-draw-modal-vertex-inputs">
                  <input type="text" className="polygon-draw-vertex-input" readOnly defaultValue={v.lat} title="Latitude" />
                  <span className="polygon-draw-vertex-comma">,</span>
                  <input type="text" className="polygon-draw-vertex-input" readOnly defaultValue={v.lng} title="Longitude" />
                </div>
                <button type="button" className="polygon-draw-modal-vertex-remove" style={{ pointerEvents: 'none' }}>×</button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="polygon-draw-modal-actions" style={{ pointerEvents: 'none' }}>
            <button type="button" className="polygon-draw-modal-btn polygon-draw-modal-btn-finish">Finish Drawing</button>
            <button type="button" className="polygon-draw-modal-btn polygon-draw-modal-btn-save">Save</button>
            <button type="button" className="polygon-draw-modal-btn polygon-draw-modal-btn-cancel">Cancel</button>
          </div>
        </div>

        {/* ---- Feature rows ---- */}
        <div className="um-feature-list">

          {/* 1. Freehand drawing */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#444' }}>
                  <FontAwesomeIcon icon={faDrawPolygon} style={{ color: '#1d4ed8', fontSize: '16px' }} />
                  <span>Click map → add vertex</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#444' }}>
                  <span style={{ width: 16, textAlign: 'center', fontWeight: 700, color: '#27ae60' }}>3+</span>
                  <span>Points → "Finish Drawing"</span>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Freehand Drawing</p>
              <p className="um-feature-desc">
                After clicking the polygon button on the map, click anywhere on the map canvas
                to place vertices. A live preview of the polygon grows with each click. Once
                you have at least 3 points, <strong>Finish Drawing</strong> appears — click it
                to close the polygon. Drag any numbered vertex marker to fine-tune its position.
              </p>
            </div>
          </div>

          {/* 2. Shape presets */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ flexDirection: 'column', gap: 0, padding: 0, minWidth: '140px' }}>
                <div className="polygon-draw-style-toolbar" style={{ pointerEvents: 'none', borderBottom: 'none', padding: '5px 6px' }}>
                  <div className="polygon-draw-style-btn-wrap">
                    <button type="button" className="polygon-draw-style-btn polygon-draw-shape-active" title="Shape Presets">
                      <FontAwesomeIcon icon={faShapes} style={{ fontSize: 14 }} />
                    </button>
                  </div>
                </div>
                <div style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 0 0 2px rgba(0,0,0,.1)', padding: '4px', width: '110px', marginLeft: '6px' }}>
                  {[
                    { label: 'Triangle', svg: <svg width="20" height="18" viewBox="0 0 20 18" fill="none" stroke="currentColor" strokeWidth="1.4"><polygon points="10,1 1,17 19,17"/></svg> },
                    { label: 'Square',   svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="1" width="16" height="16"/></svg> },
                    { label: 'Circle',   svg: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="9" cy="9" r="8"/></svg> },
                  ].map(s => (
                    <div key={s.label} className="polygon-draw-dropdown-item" style={{ pointerEvents: 'none', fontSize: '11px' }}>
                      {s.svg}<span>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Shape Presets</p>
              <p className="um-feature-desc">
                Click the shapes icon to open a preset menu: Triangle, Square, Rectangle,
                Circle, Dot, Pentagon, and Hexagon. After selecting a shape, drag on the
                map to place and size it. A circle is stored as a polygon with many
                vertices.
              </p>
            </div>
          </div>

          {/* 3. Styling */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ pointerEvents: 'none', gap: '6px', flexWrap: 'wrap', maxWidth: '220px' }}>
                {/* line style swatches */}
                {['solid','dashed','dotted'].map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%' }}>
                    <svg width="32" height="8" viewBox="0 0 32 8">
                      {s === 'solid'  && <line x1="0" y1="4" x2="32" y2="4" stroke="#333" strokeWidth="2"/>}
                      {s === 'dashed' && <line x1="0" y1="4" x2="32" y2="4" stroke="#333" strokeWidth="2" strokeDasharray="6 3"/>}
                      {s === 'dotted' && <line x1="0" y1="4" x2="32" y2="4" stroke="#333" strokeWidth="2" strokeDasharray="1.5 3" strokeLinecap="round"/>}
                    </svg>
                    <span style={{ fontSize: '11px', color: '#555' }}>{s}</span>
                  </div>
                ))}
                {/* color swatches */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {['#0077c0','#e74c3c','#27ae60','#f39c12','#8e44ad','#1abc9c'].map(c => (
                    <div key={c} style={{ width: 18, height: 18, borderRadius: 3, background: c, border: '2px solid transparent' }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Style: Line, Color &amp; Opacity</p>
              <p className="um-feature-desc">
                The toolbar lets you change the polygon's <strong>border line style</strong>{' '}
                (solid, dashed, dotted, dash-dot), <strong>fill color</strong> from a
                10-color palette, and <strong>fill opacity</strong> via a slider. Changes
                are reflected on the map immediately.
              </p>
            </div>
          </div>

          {/* 4. Curve mode */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ pointerEvents: 'none', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <svg width="50" height="36" viewBox="0 0 50 36" fill="none" stroke="#0077c0" strokeWidth="2">
                    <polyline points="5,30 25,5 45,30 5,30"/>
                  </svg>
                  <span style={{ fontSize: '10px', color: '#888' }}>Straight</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <svg width="50" height="36" viewBox="0 0 50 36" fill="none" stroke="#0077c0" strokeWidth="2">
                    <path d="M5,30 C15,5 35,5 45,30 C35,38 15,38 5,30"/>
                  </svg>
                  <span style={{ fontSize: '10px', color: '#888' }}>Curved</span>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Curve Mode</p>
              <p className="um-feature-desc">
                Toggle the curve button to switch polygon edges from straight lines to
                smooth Bézier curves. In curve mode a draggable control-point appears
                on each edge, letting you adjust the curvature independently.
              </p>
            </div>
          </div>

          {/* 5. Transform: move / rotate / resize */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ pointerEvents: 'none', gap: '10px' }}>
                {[
                  { icon: faHand,                         label: 'Move',   active: true },
                  { icon: faRotate,                        label: 'Rotate', active: false },
                  { icon: faUpRightAndDownLeftFromCenter,   label: 'Resize', active: false },
                ].map(({ icon: ic, label, active }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <div className="polygon-draw-style-btn-wrap">
                      <button type="button" className={`polygon-draw-style-btn${active ? ' polygon-draw-drag-active' : ''}`} title={label}>
                        <FontAwesomeIcon icon={ic} style={{ fontSize: 15 }} />
                      </button>
                    </div>
                    <span style={{ fontSize: '10px', color: '#666' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Transform: Move, Rotate &amp; Resize</p>
              <p className="um-feature-desc">
                Three transform modes are available once the polygon has at least 3 vertices.{' '}
                <strong>Move</strong> lets you drag the whole shape. <strong>Rotate</strong>{' '}
                spins it around its centroid. <strong>Resize</strong> shows corner and edge
                handles for scaling and stretching. Only one mode is active at a time.
              </p>
            </div>
          </div>

          {/* 6. Undo / Redo */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ pointerEvents: 'none', gap: '10px' }}>
                <div className="polygon-draw-style-btn-wrap">
                  <button type="button" className="polygon-draw-style-btn" title="Undo (Ctrl+Z)">
                    <FontAwesomeIcon icon={faRotateLeft} style={{ fontSize: 14 }} />
                  </button>
                </div>
                <div className="polygon-draw-style-btn-wrap">
                  <button type="button" className="polygon-draw-style-btn" title="Redo (Ctrl+Y)">
                    <FontAwesomeIcon icon={faRotateRight} style={{ fontSize: 14 }} />
                  </button>
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Undo &amp; Redo</p>
              <p className="um-feature-desc">
                Every vertex edit, style change, or transform is recorded in a history stack.
                Click <strong>Undo</strong> (or press <kbd>Ctrl+Z</kbd>) to step back, or{' '}
                <strong>Redo</strong> (<kbd>Ctrl+Y</kbd>) to reapply. Buttons are dimmed when
                the stack is empty.
              </p>
            </div>
          </div>

          {/* 7. Vertex list */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ pointerEvents: 'none', padding: 0, minWidth: '210px' }}>
                <div className="polygon-draw-modal-vertices" style={{ maxHeight: 'unset' }}>
                  {[{ lat: '47.6062', lng: '-122.332' }, { lat: '47.5112', lng: '-122.257' }].map((v, i) => (
                    <div key={i} className="polygon-draw-modal-vertex-row">
                      <span className="polygon-draw-modal-vertex-num">{i + 1}</span>
                      <div className="polygon-draw-modal-vertex-coords polygon-draw-modal-vertex-inputs">
                        <input type="text" className="polygon-draw-vertex-input" readOnly defaultValue={v.lat} />
                        <span className="polygon-draw-vertex-comma">,</span>
                        <input type="text" className="polygon-draw-vertex-input" readOnly defaultValue={v.lng} />
                      </div>
                      <button type="button" className="polygon-draw-modal-vertex-remove">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Vertex Coordinate List</p>
              <p className="um-feature-desc">
                Each vertex is listed with editable lat/lng number inputs. You can type exact
                coordinates directly for precision. Click <strong>×</strong> to remove any
                vertex. For circles, only the center coordinate is shown.
              </p>
            </div>
          </div>

          {/* 8. Save / Cancel / Clear */}
          <div className="um-feature-row">
            <div className="um-feature-demo">
              <div className="um-isolated-demo" style={{ pointerEvents: 'none', flexWrap: 'wrap', gap: '4px', maxWidth: '200px' }}>
                <button type="button" className="polygon-draw-modal-btn polygon-draw-modal-btn-finish" style={{ flex: '1 1 90px' }}>Finish Drawing</button>
                <button type="button" className="polygon-draw-modal-btn polygon-draw-modal-btn-resume" style={{ flex: '1 1 90px' }}>Add More Points</button>
                <button type="button" className="polygon-draw-modal-btn polygon-draw-modal-btn-save" style={{ flex: '1 1 60px' }}>Save</button>
                <button type="button" className="polygon-draw-modal-btn polygon-draw-modal-btn-cancel" style={{ flex: '1 1 60px' }}>Cancel</button>
              </div>
            </div>
            <div className="um-feature-info">
              <p className="um-feature-title">Save, Finish &amp; Cancel</p>
              <p className="um-feature-desc">
                While drawing, <strong>Finish Drawing</strong> closes the polygon. After
                finishing, <strong>Add More Points</strong> resumes vertex placement.{' '}
                <strong>Save</strong> applies the polygon as a map filter (disabled until
                3+ vertices). <strong>Cancel</strong> removes the polygon and closes the
                panel. The trash icon clears all vertices at any time.
              </p>
            </div>
          </div>

        </div>
      </section>
      )}

        </div>{/* um-content-area */}
      </div>{/* um-layout */}
    </div>
  );
}

export default UserManual;

