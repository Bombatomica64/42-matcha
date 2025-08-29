// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

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
//   photos: any[];
//   hashtags: string[];
// }

// interface SearchFilters {
//   query?: string;
//   gender?: string;
//   age_min?: number;
//   age_max?: number;
//   sort?: string;
//   order?: 'asc' | 'desc';
// }

// @Component({
//   selector: 'app-user-list',
//   template: `
//     <div class="user-list-container">
//       <!-- Search Filters -->
//       <div class="filters-section bg-white p-6 rounded-lg shadow-sm mb-6">
//         <h3 class="text-lg font-semibold mb-4">Find Your Match</h3>

//         <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           <!-- Search Query -->
//           <div>
//             <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
//             <input
//               type="text"
//               [(ngModel)]="filters.query"
//               (input)="onSearchChange($event)"
//               placeholder="Search by name..."
//               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
//             >
//           </div>

//           <!-- Gender Filter -->
//           <div>
//             <label class="block text-sm font-medium text-gray-700 mb-2">Gender</label>
//             <select
//               [(ngModel)]="filters.gender"
//               (change)="onFilterChange()"
//               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
//             >
//               <option value="">Any</option>
//               <option value="male">Male</option>
//               <option value="female">Female</option>
//               <option value="other">Other</option>
//             </select>
//           </div>

//           <!-- Age Range -->
//           <div>
//             <label class="block text-sm font-medium text-gray-700 mb-2">Min Age</label>
//             <input
//               type="number"
//               [(ngModel)]="filters.age_min"
//               (change)="onFilterChange()"
//               min="18"
//               max="100"
//               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
//             >
//           </div>

//           <div>
//             <label class="block text-sm font-medium text-gray-700 mb-2">Max Age</label>
//             <input
//               type="number"
//               [(ngModel)]="filters.age_max"
//               (change)="onFilterChange()"
//               min="18"
//               max="100"
//               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
//             >
//           </div>
//         </div>

//         <!-- Sort Options -->
//         <div class="mt-4 flex items-center space-x-4">
//           <div>
//             <label class="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
//             <select
//               [(ngModel)]="filters.sort"
//               (change)="onFilterChange()"
//               class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
//             >
//               <option value="created_at">Newest</option>
//               <option value="fame_rating">Fame Rating</option>
//               <option value="first_name">Name</option>
//               <option value="last_seen">Last Active</option>
//             </select>
//           </div>

//           <div>
//             <label class="block text-sm font-medium text-gray-700 mb-2">Order</label>
//             <select
//               [(ngModel)]="filters.order"
//               (change)="onFilterChange()"
//               class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
//             >
//               <option value="desc">Descending</option>
//               <option value="asc">Ascending</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       <!-- Loading State -->
//       <div *ngIf="loading" class="flex justify-center items-center py-12">
//         <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
//       </div>

//       <!-- Error State -->
//       <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
//         <p class="text-red-800">{{ error }}</p>
//         <button
//           (click)="loadUsers()"
//           class="mt-2 text-red-600 hover:text-red-800 underline"
//         >
//           Try Again
//         </button>
//       </div>

//       <!-- Results Info -->
//       <div *ngIf="paginatedUsers && !loading" class="mb-4 text-gray-600">
//         Showing {{ getResultsInfo() }}
//       </div>

//       <!-- User Cards Grid -->
//       <div *ngIf="paginatedUsers && !loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
//         <div
//           *ngFor="let user of paginatedUsers.data"
//           class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
//         >
//           <!-- User Photo -->
//           <div class="aspect-square relative">
//             <img
//               [src]="getUserPhoto(user)"
//               [alt]="user.first_name + ' ' + user.last_name"
//               class="w-full h-full object-cover"
//             >
//             <div class="absolute top-2 right-2">
//               <span
//                 [class]="user.online_status ? 'bg-green-500' : 'bg-gray-400'"
//                 class="inline-block w-3 h-3 rounded-full"
//               ></span>
//             </div>
//           </div>

//           <!-- User Info -->
//           <div class="p-4">
//             <h3 class="font-semibold text-lg text-gray-900">
//               {{ user.first_name }} {{ user.last_name }}, {{ user.age }}
//             </h3>
//             <p class="text-gray-600 text-sm">@{{ user.username }}</p>

//             <!-- Fame Rating -->
//             <div class="flex items-center mt-2">
//               <div class="flex text-yellow-400">
//                 <span *ngFor="let star of getStars(user.fame_rating)">★</span>
//               </div>
//               <span class="ml-2 text-sm text-gray-600">({{ user.fame_rating }})</span>
//             </div>

//             <!-- Hashtags -->
//             <div class="mt-3 flex flex-wrap gap-1">
//               <span
//                 *ngFor="let tag of user.hashtags.slice(0, 3)"
//                 class="inline-block bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full"
//               >
//                 #{{ tag }}
//               </span>
//               <span
//                 *ngIf="user.hashtags.length > 3"
//                 class="inline-block text-gray-500 text-xs px-2 py-1"
//               >
//                 +{{ user.hashtags.length - 3 }}
//               </span>
//             </div>

//             <!-- Actions -->
//             <div class="mt-4 flex space-x-2">
//               <button
//                 (click)="viewProfile(user.id)"
//                 class="flex-1 bg-pink-500 text-white py-2 px-4 rounded-md hover:bg-pink-600 transition-colors"
//               >
//                 View Profile
//               </button>
//               <button
//                 (click)="likeUser(user.id)"
//                 class="px-4 py-2 border border-pink-500 text-pink-500 rounded-md hover:bg-pink-50 transition-colors"
//               >
//                 ♥
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <!-- Pagination Controls -->
//       <div *ngIf="paginatedUsers && !loading" class="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
//         <!-- Page Size Selector -->
//         <div class="flex items-center space-x-2">
//           <label class="text-sm text-gray-700">Items per page:</label>
//           <select
//             [(ngModel)]="pageSize"
//             (change)="onPageSizeChange()"
//             class="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
//           >
//             <option value="10">10</option>
//             <option value="20">20</option>
//             <option value="50">50</option>
//           </select>
//         </div>

//         <!-- Pagination Buttons -->
//         <div class="flex items-center space-x-2">
//           <!-- First Page -->
//           <button
//             (click)="goToPage(1)"
//             [disabled]="!paginatedUsers.meta.has_previous"
//             class="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
//           >
//             First
//           </button>

//           <!-- Previous Page -->
//           <button
//             (click)="goToPage(paginatedUsers.meta.current_page - 1)"
//             [disabled]="!paginatedUsers.meta.has_previous"
//             class="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
//           >
//             Previous
//           </button>

//           <!-- Page Numbers -->
//           <div class="flex space-x-1">
//             <button
//               *ngFor="let page of getVisiblePages()"
//               (click)="goToPage(page)"
//               [class]="page === paginatedUsers.meta.current_page ?
//                 'bg-pink-500 text-white' :
//                 'bg-white text-gray-700 hover:bg-gray-50'"
//               class="px-3 py-2 text-sm border border-gray-300 rounded-md transition-colors"
//             >
//               {{ page }}
//             </button>
//           </div>

//           <!-- Next Page -->
//           <button
//             (click)="goToPage(paginatedUsers.meta.current_page + 1)"
//             [disabled]="!paginatedUsers.meta.has_next"
//             class="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
//           >
//             Next
//           </button>

//           <!-- Last Page -->
//           <button
//             (click)="goToPage(paginatedUsers.meta.total_pages)"
//             [disabled]="!paginatedUsers.meta.has_next"
//             class="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
//           >
//             Last
//           </button>
//         </div>
//       </div>

//       <!-- Empty State -->
//       <div *ngIf="paginatedUsers && paginatedUsers.data.length === 0 && !loading"
//            class="text-center py-12">
//         <div class="text-gray-400 text-6xl mb-4">💔</div>
//         <h3 class="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
//         <p class="text-gray-600">Try adjusting your search filters to find more people.</p>
//         <button
//           (click)="clearFilters()"
//           class="mt-4 text-pink-600 hover:text-pink-800 underline"
//         >
//           Clear all filters
//         </button>
//       </div>
//     </div>
//   `,
//   styles: [`
//     .user-list-container {
//       max-width: 1200px;
//       margin: 0 auto;
//       padding: 20px;
//     }
//   `]
// })
// export class UserListComponent implements OnInit, OnDestroy {
//   paginatedUsers: PaginatedResponse<User> | null = null;
//   loading = false;
//   error: string | null = null;

//   // Pagination state
//   currentPage = 1;
//   pageSize = 20;

//   // Filters
//   filters: SearchFilters = {
//     sort: 'created_at',
//     order: 'desc'
//   };

//   // Search debouncing
//   private searchSubject = new Subject<string>();
//   private destroy$ = new Subject<void>();

//   constructor(private http: HttpClient) {}

//   ngOnInit() {
//     // Setup search debouncing
//     this.searchSubject.pipe(
//       debounceTime(300),
//       distinctUntilChanged(),
//       takeUntil(this.destroy$)
//     ).subscribe(() => {
//       this.currentPage = 1; // Reset to first page on search
//       this.loadUsers();
//     });

//     // Load initial data
//     this.loadUsers();
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   /**
//    * Load users with current filters and pagination
//    */
//   loadUsers() {
//     this.loading = true;
//     this.error = null;

//     // Build query parameters
//     let params = new HttpParams()
//       .set('page', this.currentPage.toString())
//       .set('limit', this.pageSize.toString());

//     // Add filters
//     if (this.filters.query) {
//       params = params.set('query', this.filters.query);
//     }
//     if (this.filters.gender) {
//       params = params.set('gender', this.filters.gender);
//     }
//     if (this.filters.age_min) {
//       params = params.set('age_min', this.filters.age_min.toString());
//     }
//     if (this.filters.age_max) {
//       params = params.set('age_max', this.filters.age_max.toString());
//     }
//     if (this.filters.sort) {
//       params = params.set('sort', this.filters.sort);
//     }
//     if (this.filters.order) {
//       params = params.set('order', this.filters.order);
//     }

//     // Make API call
//     this.http.get<PaginatedResponse<User>>('/api/users/search', { params })
//       .subscribe({
//         next: (response) => {
//           this.paginatedUsers = response;
//           this.loading = false;
//         },
//         error: (error) => {
//           this.error = 'Failed to load users. Please try again.';
//           this.loading = false;
//           console.error('Error loading users:', error);
//         }
//       });
//   }

//   /**
//    * Handle search input changes with debouncing
//    */
//   onSearchChange(event: any) {
//     this.filters.query = event.target.value;
//     this.searchSubject.next(this.filters.query || '');
//   }

//   /**
//    * Handle filter changes
//    */
//   onFilterChange() {
//     this.currentPage = 1; // Reset to first page
//     this.loadUsers();
//   }

//   /**
//    * Handle page size changes
//    */
//   onPageSizeChange() {
//     this.currentPage = 1; // Reset to first page
//     this.loadUsers();
//   }

//   /**
//    * Go to specific page
//    */
//   goToPage(page: number) {
//     if (page >= 1 && page <= (this.paginatedUsers?.meta.total_pages || 1)) {
//       this.currentPage = page;
//       this.loadUsers();
//     }
//   }

//   /**
//    * Get visible page numbers for pagination
//    */
//   getVisiblePages(): number[] {
//     if (!this.paginatedUsers) return [];

//     const current = this.paginatedUsers.meta.current_page;
//     const total = this.paginatedUsers.meta.total_pages;
//     const visible = [];

//     // Show max 5 pages around current page
//     const start = Math.max(1, current - 2);
//     const end = Math.min(total, current + 2);

//     for (let i = start; i <= end; i++) {
//       visible.push(i);
//     }

//     return visible;
//   }

//   /**
//    * Get results info text
//    */
//   getResultsInfo(): string {
//     if (!this.paginatedUsers) return '';

//     const meta = this.paginatedUsers.meta;
//     const start = (meta.current_page - 1) * meta.per_page + 1;
//     const end = Math.min(start + meta.per_page - 1, meta.total_items);

//     return `${start}-${end} of ${meta.total_items} users`;
//   }

//   /**
//    * Clear all filters
//    */
//   clearFilters() {
//     this.filters = {
//       sort: 'created_at',
//       order: 'desc'
//     };
//     this.currentPage = 1;
//     this.loadUsers();
//   }

//   /**
//    * Get user's main photo or default
//    */
//   getUserPhoto(user: User): string {
//     const mainPhoto = user.photos.find(photo => photo.is_main);
//     return mainPhoto ? mainPhoto.image_url : '/assets/images/default-avatar.png';
//   }

//   /**
//    * Get star rating array
//    */
//   getStars(rating: number): string[] {
//     const fullStars = Math.floor(rating);
//     return Array(fullStars).fill('★');
//   }

//   /**
//    * View user profile
//    */
//   viewProfile(userId: string) {
//     // Navigate to user profile
//     console.log('View profile:', userId);
//   }

//   /**
//    * Like a user
//    */
//   likeUser(userId: string) {
//     // Implementation for liking a user
//     console.log('Like user:', userId);
//   }
// }
