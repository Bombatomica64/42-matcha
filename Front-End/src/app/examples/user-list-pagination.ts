// /**
//  * Frontend Pagination Example - Pure TypeScript/JavaScript
//  * This example shows how to consume your paginated API endpoints
//  */

// // Types matching your backend API
// interface PaginationMeta {
//   total_items: number;
//   total_pages: number;
//   current_page: number;
//   per_page: number;
//   has_previous: boolean;
//   has_next: boolean;
// }

// interface PaginationLinks {
//   first: string;
//   last: string;
//   previous?: string;
//   next?: string;
//   self: string;
// }

// interface PaginatedResponse<T> {
//   data: T[];
//   meta: PaginationMeta;
//   links: PaginationLinks;
// }

// interface User {
//   id: string;
//   username: string;
//   first_name: string;
//   last_name: string;
//   age: number;
//   gender: string;
//   fame_rating: number;
//   online_status: boolean;
//   photos: Photo[];
//   hashtags: string[];
// }

// interface Photo {
//   id: string;
//   image_url: string;
//   is_main: boolean;
// }

// interface SearchFilters {
//   query?: string;
//   gender?: string;
//   age_min?: number;
//   age_max?: number;
//   sort?: string;
//   order?: 'asc' | 'desc';
// }

// /**
//  * Pagination Service Class
//  * Handles all pagination logic and API calls
//  */
// class PaginationService {
//   private currentPage = 1;
//   private pageSize = 20;
//   private filters: SearchFilters = {};
//   private loading = false;
//   private error: string | null = null;

//   constructor(private apiBaseUrl: string = '/api') {}

//   /**
//    * Fetch paginated users from API
//    */
//   async fetchUsers(page?: number): Promise<PaginatedResponse<User>> {
//     if (page) this.currentPage = page;

//     this.loading = true;
//     this.error = null;

//     try {
//       const params = this.buildUrlParams();
//       const response = await fetch(`${this.apiBaseUrl}/users/search?${params}`);

//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }

//       const data: PaginatedResponse<User> = await response.json();
//       this.loading = false;
//       return data;
//     } catch (error) {
//       this.error = error instanceof Error ? error.message : 'Failed to fetch users';
//       this.loading = false;
//       throw error;
//     }
//   }

//   /**
//    * Update search filters and reset to page 1
//    */
//   updateFilters(newFilters: Partial<SearchFilters>) {
//     this.filters = { ...this.filters, ...newFilters };
//     this.currentPage = 1;
//   }

//   /**
//    * Update page size and reset to page 1
//    */
//   updatePageSize(size: number) {
//     this.pageSize = Math.min(Math.max(1, size), 100); // Enforce limits
//     this.currentPage = 1;
//   }

//   /**
//    * Build URL search parameters
//    */
//   private buildUrlParams(): string {
//     const params = new URLSearchParams();

//     params.set('page', this.currentPage.toString());
//     params.set('limit', this.pageSize.toString());

//     if (this.filters.query) params.set('query', this.filters.query);
//     if (this.filters.gender) params.set('gender', this.filters.gender);
//     if (this.filters.age_min) params.set('age_min', this.filters.age_min.toString());
//     if (this.filters.age_max) params.set('age_max', this.filters.age_max.toString());
//     if (this.filters.sort) params.set('sort', this.filters.sort);
//     if (this.filters.order) params.set('order', this.filters.order);

//     return params.toString();
//   }

//   // Getters
//   getCurrentPage() { return this.currentPage; }
//   getPageSize() { return this.pageSize; }
//   getFilters() { return { ...this.filters }; }
//   isLoading() { return this.loading; }
//   getError() { return this.error; }
// }

// /**
//  * UI Component Class
//  * Handles DOM manipulation and user interactions
//  */
// class UserListComponent {
//   private paginationService: PaginationService;
//   private currentData: PaginatedResponse<User> | null = null;
//   private container: HTMLElement;

//   constructor(containerId: string) {
//     this.paginationService = new PaginationService();
//     this.container = document.getElementById(containerId)!;

//     if (!this.container) {
//       throw new Error(`Container with id "${containerId}" not found`);
//     }

//     this.initialize();
//   }

//   /**
//    * Initialize the component
//    */
//   private async initialize() {
//     this.renderSkeleton();
//     this.setupEventListeners();
//     await this.loadUsers();
//   }

//   /**
//    * Load users from API and update UI
//    */
//   async loadUsers(page?: number) {
//     try {
//       this.updateLoadingState(true);
//       this.currentData = await this.paginationService.fetchUsers(page);
//       this.renderUsers();
//       this.renderPagination();
//     } catch (error) {
//       this.renderError(error instanceof Error ? error.message : 'Unknown error');
//     } finally {
//       this.updateLoadingState(false);
//     }
//   }

//   /**
//    * Render the component skeleton
//    */
//   private renderSkeleton() {
//     this.container.innerHTML = `
//       <div class="user-list">
//         <!-- Filters Section -->
//         <div class="filters" id="filters">
//           <h3>Find Your Match</h3>
//           <div class="filter-row">
//             <input type="text" id="searchQuery" placeholder="Search by name..." />
//             <select id="genderFilter">
//               <option value="">Any Gender</option>
//               <option value="male">Male</option>
//               <option value="female">Female</option>
//               <option value="other">Other</option>
//             </select>
//             <input type="number" id="ageMin" placeholder="Min Age" min="18" max="100" />
//             <input type="number" id="ageMax" placeholder="Max Age" min="18" max="100" />
//           </div>
//           <div class="sort-row">
//             <select id="sortField">
//               <option value="created_at">Newest</option>
//               <option value="fame_rating">Fame Rating</option>
//               <option value="first_name">Name</option>
//               <option value="last_seen">Last Active</option>
//             </select>
//             <select id="sortOrder">
//               <option value="desc">Descending</option>
//               <option value="asc">Ascending</option>
//             </select>
//           </div>
//         </div>

//         <!-- Loading State -->
//         <div id="loadingState" class="loading hidden">
//           <div class="spinner"></div>
//           <p>Loading users...</p>
//         </div>

//         <!-- Error State -->
//         <div id="errorState" class="error hidden">
//           <p id="errorMessage"></p>
//           <button id="retryButton">Try Again</button>
//         </div>

//         <!-- Results Info -->
//         <div id="resultsInfo" class="results-info hidden"></div>

//         <!-- Users Grid -->
//         <div id="usersGrid" class="users-grid"></div>

//         <!-- Pagination -->
//         <div id="pagination" class="pagination hidden"></div>
//       </div>
//     `;
//   }

//   /**
//    * Setup event listeners
//    */
//   private setupEventListeners() {
//     // Search input with debouncing
//     const searchInput = this.container.querySelector('#searchQuery') as HTMLInputElement;
//     let searchTimeout: number;

//     searchInput?.addEventListener('input', (e) => {
//       clearTimeout(searchTimeout);
//       searchTimeout = window.setTimeout(() => {
//         this.paginationService.updateFilters({
//           query: (e.target as HTMLInputElement).value || undefined
//         });
//         this.loadUsers();
//       }, 300);
//     });

//     // Filter changes
//     ['genderFilter', 'ageMin', 'ageMax', 'sortField', 'sortOrder'].forEach(id => {
//       const element = this.container.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement;
//       element?.addEventListener('change', () => this.handleFilterChange());
//     });

//     // Retry button
//     const retryButton = this.container.querySelector('#retryButton');
//     retryButton?.addEventListener('click', () => this.loadUsers());
//   }

//   /**
//    * Handle filter changes
//    */
//   private handleFilterChange() {
//     const filters: SearchFilters = {};

//     const gender = (this.container.querySelector('#genderFilter') as HTMLSelectElement).value;
//     const ageMin = (this.container.querySelector('#ageMin') as HTMLInputElement).value;
//     const ageMax = (this.container.querySelector('#ageMax') as HTMLInputElement).value;
//     const sort = (this.container.querySelector('#sortField') as HTMLSelectElement).value;
//     const order = (this.container.querySelector('#sortOrder') as HTMLSelectElement).value as 'asc' | 'desc';

//     if (gender) filters.gender = gender;
//     if (ageMin) filters.age_min = parseInt(ageMin);
//     if (ageMax) filters.age_max = parseInt(ageMax);
//     if (sort) filters.sort = sort;
//     if (order) filters.order = order;

//     this.paginationService.updateFilters(filters);
//     this.loadUsers();
//   }

//   /**
//    * Update loading state
//    */
//   private updateLoadingState(loading: boolean) {
//     const loadingEl = this.container.querySelector('#loadingState');
//     const contentEls = this.container.querySelectorAll('#usersGrid, #pagination, #resultsInfo');

//     if (loading) {
//       loadingEl?.classList.remove('hidden');
//       contentEls.forEach(el => el.classList.add('hidden'));
//     } else {
//       loadingEl?.classList.add('hidden');
//       contentEls.forEach(el => el.classList.remove('hidden'));
//     }
//   }

//   /**
//    * Render users grid
//    */
//   private renderUsers() {
//     if (!this.currentData) return;

//     const grid = this.container.querySelector('#usersGrid');
//     const resultsInfo = this.container.querySelector('#resultsInfo');

//     if (!grid || !resultsInfo) return;

//     // Update results info
//     const { meta } = this.currentData;
//     const start = (meta.current_page - 1) * meta.per_page + 1;
//     const end = Math.min(start + meta.per_page - 1, meta.total_items);
//     resultsInfo.textContent = `Showing ${start}-${end} of ${meta.total_items} users`;

//     // Render user cards
//     if (this.currentData.data.length === 0) {
//       grid.innerHTML = `
//         <div class="empty-state">
//           <div class="empty-icon">💔</div>
//           <h3>No matches found</h3>
//           <p>Try adjusting your search filters</p>
//           <button onclick="this.clearFilters()">Clear Filters</button>
//         </div>
//       `;
//       return;
//     }

//     grid.innerHTML = this.currentData.data.map(user => `
//       <div class="user-card">
//         <div class="user-photo">
//           <img src="${this.getUserPhoto(user)}" alt="${user.first_name} ${user.last_name}" />
//           <div class="status ${user.online_status ? 'online' : 'offline'}"></div>
//         </div>
//         <div class="user-info">
//           <h3>${user.first_name} ${user.last_name}, ${user.age || 'N/A'}</h3>
//           <p class="username">@${user.username}</p>
//           <div class="fame-rating">
//             ${'★'.repeat(Math.floor(user.fame_rating))} (${user.fame_rating})
//           </div>
//           <div class="hashtags">
//             ${user.hashtags.slice(0, 3).map(tag => `<span class="tag">#${tag}</span>`).join('')}
//             ${user.hashtags.length > 3 ? `<span class="more">+${user.hashtags.length - 3}</span>` : ''}
//           </div>
//           <div class="actions">
//             <button onclick="viewProfile('${user.id}')" class="btn-primary">View Profile</button>
//             <button onclick="likeUser('${user.id}')" class="btn-secondary">♥</button>
//           </div>
//         </div>
//       </div>
//     `).join('');
//   }

//   /**
//    * Render pagination controls
//    */
//   private renderPagination() {
//     if (!this.currentData) return;

//     const pagination = this.container.querySelector('#pagination');
//     if (!pagination) return;

//     const { meta } = this.currentData;

//     if (meta.total_pages <= 1) {
//       pagination.classList.add('hidden');
//       return;
//     }

//     pagination.classList.remove('hidden');

//     // Generate page numbers (show 5 pages around current)
//     const visiblePages = [];
//     const start = Math.max(1, meta.current_page - 2);
//     const end = Math.min(meta.total_pages, meta.current_page + 2);

//     for (let i = start; i <= end; i++) {
//       visiblePages.push(i);
//     }

//     pagination.innerHTML = `
//       <div class="pagination-info">
//         <select id="pageSize" value="${this.paginationService.getPageSize()}">
//           <option value="10">10 per page</option>
//           <option value="20">20 per page</option>
//           <option value="50">50 per page</option>
//         </select>
//       </div>
//       <div class="pagination-controls">
//         <button
//           ${!meta.has_previous ? 'disabled' : ''}
//           onclick="userList.loadUsers(1)"
//         >
//           First
//         </button>
//         <button
//           ${!meta.has_previous ? 'disabled' : ''}
//           onclick="userList.loadUsers(${meta.current_page - 1})"
//         >
//           Previous
//         </button>

//         ${visiblePages.map(page => `
//           <button
//             class="${page === meta.current_page ? 'active' : ''}"
//             onclick="userList.loadUsers(${page})"
//           >
//             ${page}
//           </button>
//         `).join('')}

//         <button
//           ${!meta.has_next ? 'disabled' : ''}
//           onclick="userList.loadUsers(${meta.current_page + 1})"
//         >
//           Next
//         </button>
//         <button
//           ${!meta.has_next ? 'disabled' : ''}
//           onclick="userList.loadUsers(${meta.total_pages})"
//         >
//           Last
//         </button>
//       </div>
//     `;

//     // Page size selector
//     const pageSize = pagination.querySelector('#pageSize') as HTMLSelectElement;
//     pageSize.value = this.paginationService.getPageSize().toString();
//     pageSize.addEventListener('change', (e) => {
//       this.paginationService.updatePageSize(parseInt((e.target as HTMLSelectElement).value));
//       this.loadUsers();
//     });
//   }

//   /**
//    * Render error state
//    */
//   private renderError(message: string) {
//     const errorEl = this.container.querySelector('#errorState');
//     const errorMessage = this.container.querySelector('#errorMessage');

//     if (errorEl && errorMessage) {
//       errorMessage.textContent = message;
//       errorEl.classList.remove('hidden');
//     }
//   }

//   /**
//    * Get user's main photo or default
//    */
//   private getUserPhoto(user: User): string {
//     const mainPhoto = user.photos.find(photo => photo.is_main);
//     return mainPhoto ? mainPhoto.image_url : '/assets/images/default-avatar.png';
//   }

//   /**
//    * Clear all filters
//    */
//   clearFilters() {
//     this.paginationService.updateFilters({});
//     // Reset form elements
//     (this.container.querySelector('#searchQuery') as HTMLInputElement).value = '';
//     (this.container.querySelector('#genderFilter') as HTMLSelectElement).value = '';
//     (this.container.querySelector('#ageMin') as HTMLInputElement).value = '';
//     (this.container.querySelector('#ageMax') as HTMLInputElement).value = '';
//     this.loadUsers();
//   }
// }

// // Global functions for button clicks
// function viewProfile(userId: string) {
//   console.log('View profile:', userId);
//   // Implement navigation to profile page
// }

// function likeUser(userId: string) {
//   console.log('Like user:', userId);
//   // Implement like functionality
// }

// // Initialize when DOM is ready
// let userList: UserListComponent;

// document.addEventListener('DOMContentLoaded', () => {
//   userList = new UserListComponent('userListContainer');
// });

// // Export for module usage
// export { UserListComponent, PaginationService };

// /*
// HTML to include in your page:

// <!DOCTYPE html>
// <html>
// <head>
//   <title>User List with Pagination</title>
//   <style>
//     .user-list { max-width: 1200px; margin: 0 auto; padding: 20px; }
//     .filters { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
//     .filter-row, .sort-row { display: flex; gap: 15px; margin-bottom: 15px; }
//     .filter-row input, .filter-row select, .sort-row select {
//       padding: 8px; border: 1px solid #ddd; border-radius: 4px;
//     }
//     .users-grid {
//       display: grid;
//       grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
//       gap: 20px;
//       margin-bottom: 30px;
//     }
//     .user-card {
//       background: white;
//       border-radius: 8px;
//       overflow: hidden;
//       box-shadow: 0 2px 4px rgba(0,0,0,0.1);
//     }
//     .user-photo { position: relative; aspect-ratio: 1; }
//     .user-photo img { width: 100%; height: 100%; object-fit: cover; }
//     .status {
//       position: absolute;
//       top: 10px;
//       right: 10px;
//       width: 12px;
//       height: 12px;
//       border-radius: 50%;
//     }
//     .status.online { background: #22c55e; }
//     .status.offline { background: #6b7280; }
//     .user-info { padding: 15px; }
//     .hashtags { margin: 10px 0; }
//     .tag {
//       background: #fce7f3;
//       color: #be185d;
//       padding: 2px 8px;
//       border-radius: 12px;
//       font-size: 12px;
//       margin-right: 5px;
//     }
//     .actions { display: flex; gap: 10px; margin-top: 15px; }
//     .btn-primary {
//       flex: 1;
//       background: #ec4899;
//       color: white;
//       border: none;
//       padding: 8px 16px;
//       border-radius: 4px;
//       cursor: pointer;
//     }
//     .btn-secondary {
//       background: white;
//       color: #ec4899;
//       border: 1px solid #ec4899;
//       padding: 8px 12px;
//       border-radius: 4px;
//       cursor: pointer;
//     }
//     .pagination {
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//       padding: 20px 0;
//     }
//     .pagination-controls { display: flex; gap: 5px; }
//     .pagination-controls button {
//       padding: 8px 12px;
//       border: 1px solid #ddd;
//       background: white;
//       cursor: pointer;
//       border-radius: 4px;
//     }
//     .pagination-controls button:disabled { opacity: 0.5; cursor: not-allowed; }
//     .pagination-controls button.active { background: #ec4899; color: white; }
//     .loading { text-align: center; padding: 40px; }
//     .spinner {
//       border: 2px solid #f3f3f3;
//       border-top: 2px solid #ec4899;
//       border-radius: 50%;
//       width: 30px;
//       height: 30px;
//       animation: spin 1s linear infinite;
//       margin: 0 auto 15px;
//     }
//     @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
//     .hidden { display: none; }
//     .empty-state {
//       text-align: center;
//       padding: 60px 20px;
//       grid-column: 1 / -1;
//     }
//     .empty-icon { font-size: 48px; margin-bottom: 15px; }
//   </style>
// </head>
// <body>
//   <div id="userListContainer"></div>
//   <script src="user-list-component.js"></script>
// </body>
// </html>
// */
