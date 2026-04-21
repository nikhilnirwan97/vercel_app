document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const tagFilter = document.getElementById('tagFilter');
    const linksContainer = document.getElementById('linksContainer');
    const loadingState = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');
    
    // Modal Elements
    const modal = document.getElementById('resourceModal');
    const openAddModalBtn = document.getElementById('openAddModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const resourceForm = document.getElementById('resourceForm');
    
    // Form Inputs
    const resourceIdInput = document.getElementById('resourceId');
    const titleInput = document.getElementById('title');
    const urlInput = document.getElementById('url');
    const tagInput = document.getElementById('tag');
    const modalTitle = document.getElementById('modalTitle');

    // Debounce timer for search
    let searchTimeout;

    // --- Core Operations ---
    
    // Fetch all resources from API
    async function fetchLinks() {
        showLoading();
        try {
            const searchTerm = searchInput.value.trim();
            const tag = tagFilter.value;
            
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (tag) params.append('tag', tag);
            
            const response = await fetch(`/api/links?${params.toString()}`);
            if (!response.ok) {
                try {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to fetch resources');
                } catch(e) {
                    throw new Error(e.message || 'Failed to fetch resources');
                }
            }
            
            const data = await response.json();
            renderLinks(data);
        } catch (error) {
            console.error('Error fetching links:', error);
            linksContainer.innerHTML = `<div style="color:var(--danger); grid-column:1/-1; text-align:center; padding: 2rem; background: rgba(255,0,0,0.1); border-radius: 8px;"><strong>Database Error:</strong><br><br>${error.message}</div>`;
            linksContainer.style.display = 'grid';
            loadingState.style.display = 'none';
            emptyState.style.display = 'none';
        }
    }

    // Render links to DOM
    function renderLinks(links) {
        linksContainer.innerHTML = '';
        loadingState.style.display = 'none';
        
        if (links.length === 0) {
            emptyState.style.display = 'flex';
            linksContainer.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        linksContainer.style.display = 'grid';

        links.forEach(link => {
            const card = document.createElement('article');
            card.className = 'resource-card';
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${escapeHTML(link.title)}</h3>
                    <span class="tag-badge" data-tag="${escapeHTML(link.tag)}">${escapeHTML(link.tag)}</span>
                </div>
                <a href="${escapeHTML(link.url)}" target="_blank" rel="noopener noreferrer" class="card-url" title="${escapeHTML(link.url)}">
                    <i class="ph ph-link"></i> ${escapeHTML(link.url)}
                </a>
                <div class="card-actions">
                    <button class="icon-btn edit-btn" data-id="${link.id}" data-title="${escapeHTML(link.title)}" data-url="${escapeHTML(link.url)}" data-tag="${escapeHTML(link.tag)}" title="Edit">
                        <i class="ph ph-pencil-simple"></i>
                    </button>
                    <button class="icon-btn delete-btn" data-id="${link.id}" title="Delete">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            `;
            linksContainer.appendChild(card);
        });

        // Attach event listeners to newly created buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnData = e.currentTarget.dataset;
                openEditModal(btnData.id, btnData.title, btnData.url, btnData.tag);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                deleteLink(id);
            });
        });
    }

    // Save (Create/Update) resource
    async function saveResource(e) {
        e.preventDefault();
        
        const isEdit = !!resourceIdInput.value;
        const url = isEdit ? `/api/links/${resourceIdInput.value}` : '/api/links';
        const method = isEdit ? 'PUT' : 'POST';
        
        const payload = {
            title: titleInput.value.trim(),
            url: urlInput.value.trim(),
            tag: tagInput.value.trim() || 'Other'
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save resource');
            
            closeModal();
            fetchLinks(); // Refresh list
        } catch (error) {
            console.error('Error saving resource:', error);
            alert('Failed to save resource. Check console for details.');
        }
    }

    // Delete resource
    async function deleteLink(id) {
        if (!confirm('Are you sure you want to delete this resource?')) return;

        try {
            const response = await fetch(`/api/links/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete resource');
            
            fetchLinks(); // Refresh list
        } catch (error) {
            console.error('Error deleting resource:', error);
            alert('Failed to delete resource.');
        }
    }

    // --- UI Helpers ---
    
    function showLoading() {
        loadingState.style.display = 'flex';
        linksContainer.style.display = 'none';
        emptyState.style.display = 'none';
    }

    function openModal() {
        modalTitle.textContent = 'Add New Resource';
        resourceForm.reset();
        resourceIdInput.value = '';
        modal.style.display = 'flex';
        setTimeout(() => titleInput.focus(), 100);
    }

    function openEditModal(id, title, url, tag) {
        modalTitle.textContent = 'Edit Resource';
        resourceIdInput.value = id;
        titleInput.value = title;
        urlInput.value = url;
        tagInput.value = tag;
        modal.style.display = 'flex';
        setTimeout(() => titleInput.focus(), 100);
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    // HTML escape to prevent XSS
    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // --- Event Listeners ---
    
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(fetchLinks, 300); // 300ms debounce
    });

    tagFilter.addEventListener('change', fetchLinks);
    
    openAddModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(); // Close on backdrop click
    });

    resourceForm.addEventListener('submit', saveResource);

    // Initial Fetch
    fetchLinks();
});
