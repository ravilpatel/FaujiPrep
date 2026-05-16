// Application Initialization
(async () => {

    // --- State Variables ---
    let stateData = window.stateData || {};
    let currentActivePath = null;
    let currentRegion = 'All';

    // --- DOM Elements ---
    const mapWrapper = document.getElementById('mapWrapper');
    const tooltip = document.getElementById('tooltip');
    const detailsPanel = document.getElementById('detailsPanel');
    const panelEmptyState = document.querySelector('.panel-empty-state');
    const panelContent = document.querySelector('.panel-content');
    const closePanelBtn = document.getElementById('closePanelBtn');

    const entityType = document.getElementById('entityType');
    const entityName = document.getElementById('entityName');
    const entityRegion = document.getElementById('entityRegion');
    const entityCapital = document.getElementById('entityCapital');
    const entityCM = document.getElementById('entityCM');
    const entityGovernor = document.getElementById('entityGovernor');
    const governorLabel = document.getElementById('governorLabel');
    const entityLanguage = document.getElementById('entityLanguage');
    const entityFormation = document.getElementById('entityFormation');
    const entityPopulation = document.getElementById('entityPopulation');

    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const resetMapBtn = document.getElementById('resetMapBtn');
    const filterBtns = document.querySelectorAll('.filter-btn');

    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    const stateBreadcrumbItem = document.getElementById('stateBreadcrumbItem');
    const stateBreadcrumb = document.getElementById('stateBreadcrumb');
    const homeBreadcrumb = document.getElementById('homeBreadcrumb');

    // --- Initialize Application ---
    function init() {
        // Initialize SVG Map since it's already in the DOM
        const svg = mapWrapper.querySelector('svg');
        if (svg) {
            // Ensure SVG is responsive by adding viewBox if missing
            if (!svg.getAttribute('viewBox')) {
                const w = svg.getAttribute('width');
                const h = svg.getAttribute('height');
                if (w && h) {
                    svg.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
                    svg.removeAttribute('width');
                    svg.removeAttribute('height');
                }
            }

            // Remove native title elements to prevent default browser tooltips
            svg.querySelectorAll('title').forEach(t => t.remove());

            // Override default styles from the SVG
            const paths = svg.querySelectorAll('path');
            paths.forEach(path => {
                path.removeAttribute('class'); // Remove class to allow our CSS to govern entirely
                // Setup path interactions
                setupPathInteractions(path);
            });
        } else {
            console.error('Failed to find SVG map in DOM.');
            mapWrapper.innerHTML = '<p style="text-align:center; padding: 2rem;">Error loading map.</p>';
        }

        setupThemeToggle();
        setupSearch();
        setupFilters();
        setupEventListeners();
    }

    // --- Interaction Setup ---
    function setupPathInteractions(path) {
        const pathId = path.getAttribute('id');
        if (!stateData[pathId]) return;

        path.addEventListener('mouseenter', (e) => {
            showTooltip(e, stateData[pathId].name);
        });

        path.addEventListener('mousemove', (e) => {
            moveTooltip(e);
        });

        path.addEventListener('mouseleave', () => {
            hideTooltip();
        });

        path.addEventListener('click', () => {
            selectState(pathId, path);
        });

        // Keyboard accessibility
        path.setAttribute('tabindex', '0');
        path.setAttribute('role', 'button');
        path.setAttribute('aria-label', stateData[pathId].name);

        path.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectState(pathId, path);
            }
        });
    }

    function setupEventListeners() {
        closePanelBtn.addEventListener('click', closeDetailsPanel);

        resetMapBtn.addEventListener('click', resetMap);

        homeBreadcrumb.addEventListener('click', (e) => {
            e.preventDefault();
            resetMap();
        });

        // Close panel when clicking outside on map empty areas
        mapWrapper.addEventListener('click', (e) => {
            if (e.target.tagName !== 'path' && currentActivePath) {
                resetMap();
            }
        });

        // Close search results on outside click
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }

    // --- State Selection & Panel ---
    function selectState(id, pathElement) {
        if (!stateData[id]) return;

        // Remove active class from previous
        if (currentActivePath) {
            currentActivePath.classList.remove('active');
        }

        // Set new active
        pathElement.classList.add('active');
        currentActivePath = pathElement;

        const data = stateData[id];

        // Update Panel Content
        entityType.textContent = data.type;
        entityName.textContent = data.name;
        entityRegion.textContent = data.region;
        entityCapital.textContent = data.capital;
        entityCM.textContent = data.chiefMinister;
        entityGovernor.textContent = data.governor;
        entityLanguage.textContent = data.officialLanguage;
        entityFormation.textContent = data.formationDate;
        entityPopulation.textContent = data.population;

        // Adjust labels based on type
        if (data.type === 'Union Territory') {
            governorLabel.textContent = 'Administrator / Lt. Gov.';
            if (data.chiefMinister === 'N/A' || data.chiefMinister === 'N/A (President\\'s Rule) ') {
            entityCM.textContent = 'Not Applicable';
        }
    } else {
        governorLabel.textContent = 'Governor';
    }

    // Toggle Panel Views
    panelEmptyState.style.display = 'none';
    panelContent.style.display = 'block';

    // Update Breadcrumb
    stateBreadcrumb.textContent = data.name;
    stateBreadcrumbItem.style.display = 'inline';
}

    function closeDetailsPanel() {
    panelEmptyState.style.display = 'flex';
    panelContent.style.display = 'none';
    stateBreadcrumbItem.style.display = 'none';

    if (currentActivePath) {
        currentActivePath.classList.remove('active');
        currentActivePath = null;
    }
}

function resetMap() {
    closeDetailsPanel();

    // Reset Search
    searchInput.value = '';
    searchResults.style.display = 'none';

    // Reset Filters
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.filter-btn[data-region="All"]').classList.add('active');
    currentRegion = 'All';
    applyRegionFilter();
}

// --- Tooltip ---
function showTooltip(e, text) {
    tooltip.textContent = text;
    tooltip.classList.add('visible');
    moveTooltip(e);
}

function moveTooltip(e) {
    const xOffset = 15;
    const yOffset = 15;
    tooltip.style.left = (e.pageX + xOffset) + 'px';
    tooltip.style.top = (e.pageY + yOffset) + 'px';
}

function hideTooltip() {
    tooltip.classList.remove('visible');
}

// --- Search Functionality ---
function setupSearch() {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        searchResults.innerHTML = '';

        if (query.length < 1) {
            searchResults.style.display = 'none';
            return;
        }

        const matches = Object.entries(stateData).filter(([id, data]) => {
            return data.name.toLowerCase().includes(query) ||
                data.capital.toLowerCase().includes(query);
        });

        if (matches.length > 0) {
            matches.forEach(([id, data]) => {
                const li = document.createElement('li');
                li.innerHTML = \`<span class="match-name">\${data.name}</span><span class="match-type">Capital: \${data.capital}</span>\`;
                    li.addEventListener('click', () => {
                        const path = document.getElementById(id);
                        if (path) {
                            selectState(id, path);
                            // Highlight the path by simulating filter
                            dimUnselectedPaths(path);
                        }
                        searchResults.style.display = 'none';
                        searchInput.value = data.name;
                    });
                    searchResults.appendChild(li);
                });
                searchResults.style.display = 'block';
            } else {
                searchResults.style.display = 'none';
            }
        });
    }

    function dimUnselectedPaths(activePath) {
        const paths = document.querySelectorAll('#mapWrapper path');
        paths.forEach(p => {
            if (p !== activePath) {
                p.classList.add('dimmed');
            } else {
                p.classList.remove('dimmed');
            }
        });
    }

    // --- Filters ---
    function setupFilters() {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentRegion = btn.getAttribute('data-region');
                applyRegionFilter();
            });
        });
    }

    function applyRegionFilter() {
        const paths = document.querySelectorAll('#mapWrapper path');
        
        paths.forEach(path => {
            const id = path.getAttribute('id');
            const data = stateData[id];
            
            if (!data) return;
            
            if (currentRegion === 'All') {
                path.classList.remove('dimmed');
            } else if (currentRegion === 'UT') {
                if (data.type === 'Union Territory') {
                    path.classList.remove('dimmed');
                } else {
                    path.classList.add('dimmed');
                }
            } else {
                if (data.region === currentRegion) {
                    path.classList.remove('dimmed');
                } else {
                    path.classList.add('dimmed');
                }
            }
        });
    }

    // --- Theme Toggle ---
    function setupThemeToggle() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcons(savedTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcons(newTheme);
        });
    }
    
    function updateThemeIcons(theme) {
        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }

    // Start App
    init();
})();
