/**
 * Angular Pagination Example
 * Shows how to use the standardized pagination with Angular
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { 
  takeUntil, 
  debounceTime, 
  distinctUntilChanged, 
  switchMap, 
  startWith,
  map,
  catchError 
} from 'rxjs/operators';
import { of } from 'rxjs';

// Types from your backend API
interface PaginationMeta {
  total_items: number;
  total_pages: number;
  current_page: number;
  per_page: number;
  has_previous: boolean;
  has_next: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links: {
    first: string;
    last: string;
    previous?: string;
    next?: string;
    self: string;
  };
}

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  fame_rating: number;
  online_status: boolean;
  photos: Array<{ id: string; image_url: string; is_main: boolean }>;
  hashtags: string[];
}

interface SearchFilters {
  query?: string;
  gender?: string;
  age_min?: number;
  age_max?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

@Component({
  selector: 'app-user-list',
  template: `
    <div class="user-list-container">
      <!-- Search Filters -->
      <div class="filters-section bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 class="text-lg font-semibold mb-4">Find Your Match</h3>
        
        <form [formGroup]="filterForm" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Search Query -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                formControlName="query"
                placeholder="Search by name..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <!-- Gender Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                formControlName="gender"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <!-- Age Range -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Min Age</label>
              <input
                type="number"
                formControlName="age_min"
                min="18"
                max="100"
                placeholder="18"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Max Age</label>
              <input
                type="number"
                formControlName="age_max"
                min="18"
                max="100"
                placeholder="100"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <!-- Sort Options -->
          <div class="flex items-center space-x-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select
                formControlName="sort"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="created_at">Newest</option>
                <option value="fame_rating">Fame Rating</option>
                <option value="first_name">Name</option>
                <option value="last_seen">Last Active</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                formControlName="order"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div class="pt-6">
              <button
                type="button"
                (click)="clearFilters()"
                class="px-4 py-2 text-pink-600 hover:text-pink-800 underline"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading$ | async" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <span class="ml-3 text-gray-600">Loading users...</span>
      </div>

      <!-- Error State -->
      <div *ngIf="error$ | async as error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <p class="text-red-800">{{ error }}</p>
        <button 
          (click)="retryLoad()"
          class="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>

      <!-- Results Info -->
      <div *ngIf="(paginatedUsers$ | async) && !(loading$ | async)" class="mb-4 text-gray-600">
        {{ getResultsInfo() }}
      </div>

      <!-- User Cards Grid -->
      <div *ngIf="(paginatedUsers$ | async) as users" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <div 
          *ngFor="let user of users.data" 
          class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
        >
          <!-- User Photo -->
          <div class="aspect-square relative">
            <img 
              [src]="getUserPhoto(user)" 
              [alt]="user.first_name + ' ' + user.last_name"
              class="w-full h-full object-cover"
              (error)="onImageError($event)"
            />
            <div class="absolute top-2 right-2">
              <span 
                [class]="user.online_status ? 'bg-green-500' : 'bg-gray-400'"
                class="inline-block w-3 h-3 rounded-full"
              ></span>
            </div>
          </div>

          <!-- User Info -->
          <div class="p-4">
            <h3 class="font-semibold text-lg text-gray-900">
              {{ user.first_name }} {{ user.last_name }}, {{ user.age }}
            </h3>
            <p class="text-gray-600 text-sm">@{{ user.username }}</p>
            
            <!-- Fame Rating -->
            <div class="flex items-center mt-2">
              <div class="flex text-yellow-400">
                <span *ngFor="let star of getStars(user.fame_rating)">★</span>
              </div>
              <span class="ml-2 text-sm text-gray-600">({{ user.fame_rating }})</span>
            </div>

            <!-- Hashtags -->
            <div class="mt-3 flex flex-wrap gap-1">
              <span 
                *ngFor="let tag of user.hashtags.slice(0, 3)" 
                class="inline-block bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full"
              >
                #{{ tag }}
              </span>
              <span 
                *ngIf="user.hashtags.length > 3"
                class="inline-block text-gray-500 text-xs px-2 py-1"
              >
                +{{ user.hashtags.length - 3 }}
              </span>
            </div>

            <!-- Actions -->
            <div class="mt-4 flex space-x-2">
              <button 
                (click)="viewProfile(user.id)"
                class="flex-1 bg-pink-500 text-white py-2 px-4 rounded-md hover:bg-pink-600 transition-colors"
              >
                View Profile
              </button>
              <button 
                (click)="likeUser(user.id)"
                class="px-4 py-2 border border-pink-500 text-pink-500 rounded-md hover:bg-pink-50 transition-colors"
              >
                ♥
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div *ngIf="(paginatedUsers$ | async) as users" class="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <!-- Page Size Selector -->
        <div class="flex items-center space-x-2">
          <label class="text-sm text-gray-700">Items per page:</label>
          <select
            [value]="pageSize$ | async"
            (change)="onPageSizeChange($event)"
            class="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>

        <!-- Pagination Buttons -->
        <div class="flex items-center space-x-2">
          <!-- First Page -->
          <button
            (click)="goToPage(1)"
            [disabled]="!users.meta.has_previous"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>

          <!-- Previous Page -->
          <button
            (click)="goToPage(users.meta.current_page - 1)"
            [disabled]="!users.meta.has_previous"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <!-- Page Numbers -->
          <div class="flex space-x-1">
            <button
              *ngFor="let page of getVisiblePages(users.meta)"
              (click)="goToPage(page)"
              [class]="page === users.meta.current_page ? 
                'bg-pink-500 text-white border-pink-500' : 
                'bg-white text-gray-700 hover:bg-gray-50'"
              class="px-3 py-2 text-sm border border-gray-300 rounded-md transition-colors"
            >
              {{ page }}
            </button>
          </div>

          <!-- Next Page -->
          <button
            (click)="goToPage(users.meta.current_page + 1)"
            [disabled]="!users.meta.has_next"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>

          <!-- Last Page -->
          <button
            (click)="goToPage(users.meta.total_pages)"
            [disabled]="!users.meta.has_next"
            class="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="(paginatedUsers$ | async)?.data.length === 0 && !(loading$ | async)" 
           class="text-center py-12">
        <div class="text-gray-400 text-6xl mb-4">💔</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
        <p class="text-gray-600">Try adjusting your search filters to find more people.</p>
        <button 
          (click)="clearFilters()"
          class="mt-4 text-pink-600 hover:text-pink-800 underline"
        >
          Clear all filters
        </button>
      </div>
    </div>
  `,
  styles: [`
    .user-list-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .aspect-square {
      aspect-ratio: 1;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class UserListComponent implements OnInit, OnDestroy {
  filterForm!: FormGroup;
  
  // Observables
  paginatedUsers$ = new BehaviorSubject<PaginatedResponse<User> | null>(null);
  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);
  currentPage$ = new BehaviorSubject<number>(1);
  pageSize$ = new BehaviorSubject<number>(20);
  
  private destroy$ = new Subject<void>();
  private apiBaseUrl = '/api';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.createForm();
  }

  ngOnInit() {
    this.setupFilterSubscription();
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm() {
    this.filterForm = this.fb.group({
      query: [''],
      gender: [''],
      age_min: [null],
      age_max: [null],
      sort: ['created_at'],
      order: ['desc']
    });
  }

  private setupFilterSubscription() {
    // Combine form changes with pagination changes
    const formChanges$ = this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value),
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    );

    const paginationChanges$ = combineLatest([
      this.currentPage$,
      this.pageSize$
    ]);

    // Subscribe to combined changes
    combineLatest([formChanges$, paginationChanges$]).pipe(
      takeUntil(this.destroy$),
      switchMap(([filters, [page, pageSize]]) => {
        return this.fetchUsers(filters, page, pageSize);
      })
    ).subscribe({
      next: (response) => {
        this.paginatedUsers$.next(response);
        this.loading$.next(false);
        this.error$.next(null);
      },
      error: (error) => {
        this.error$.next('Failed to load users. Please try again.');
        this.loading$.next(false);
        console.error('Error loading users:', error);
      }
    });
  }

  private fetchUsers(filters: SearchFilters, page: number, pageSize: number) {
    this.loading$.next(true);
    this.error$.next(null);

    // Build query parameters
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString());

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedResponse<User>>(`${this.apiBaseUrl}/users/search`, { params }).pipe(
      catchError(error => {
        console.error('API Error:', error);
        throw error;
      })
    );
  }

  /**
   * Handle filter changes that should reset to page 1
   */
  onFilterChange() {
    this.currentPage$.next(1);
  }

  /**
   * Handle page size changes
   */
  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    this.pageSize$.next(newSize);
    this.currentPage$.next(1); // Reset to first page
  }

  /**
   * Go to specific page
   */
  goToPage(page: number) {
    const currentData = this.paginatedUsers$.value;
    if (currentData && page >= 1 && page <= currentData.meta.total_pages) {
      this.currentPage$.next(page);
    }
  }

  /**
   * Get visible page numbers for pagination
   */
  getVisiblePages(meta: PaginationMeta): number[] {
    const visible = [];
    const start = Math.max(1, meta.current_page - 2);
    const end = Math.min(meta.total_pages, meta.current_page + 2);
    
    for (let i = start; i <= end; i++) {
      visible.push(i);
    }
    
    return visible;
  }

  /**
   * Get results info text
   */
  getResultsInfo(): string {
    const currentData = this.paginatedUsers$.value;
    if (!currentData) return '';
    
    const meta = currentData.meta;
    const start = (meta.current_page - 1) * meta.per_page + 1;
    const end = Math.min(start + meta.per_page - 1, meta.total_items);
    
    return `Showing ${start}-${end} of ${meta.total_items} users`;
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.filterForm.reset({
      query: '',
      gender: '',
      age_min: null,
      age_max: null,
      sort: 'created_at',
      order: 'desc'
    });
    this.currentPage$.next(1);
  }

  /**
   * Retry loading after error
   */
  retryLoad() {
    this.onFilterChange();
  }

  /**
   * Get user's main photo or default
   */
  getUserPhoto(user: User): string {
    const mainPhoto = user.photos.find(photo => photo.is_main);
    return mainPhoto ? mainPhoto.image_url : '/assets/images/default-avatar.png';
  }

  /**
   * Handle image load errors
   */
  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = '/assets/images/default-avatar.png';
  }

  /**
   * Get star rating array
   */
  getStars(rating: number): string[] {
    const fullStars = Math.floor(rating);
    return Array(fullStars).fill('★');
  }

  /**
   * View user profile
   */
  viewProfile(userId: string) {
    // Navigate to user profile
    console.log('View profile:', userId);
    // Example: this.router.navigate(['/profile', userId]);
  }

  /**
   * Like a user
   */
  likeUser(userId: string) {
    // Implementation for liking a user
    console.log('Like user:', userId);
    // Example: this.userService.likeUser(userId).subscribe(...);
  }
}

// Pagination Controls Component
interface PaginationControlsProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  meta,
  onPageChange,
  pageSize,
  onPageSizeChange
}) => {
  // Generate visible page numbers
  const getVisiblePages = () => {
    const pages = [];
    const start = Math.max(1, meta.current_page - 2);
    const end = Math.min(meta.total_pages, meta.current_page + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const getResultsInfo = () => {
    const start = (meta.current_page - 1) * meta.per_page + 1;
    const end = Math.min(start + meta.per_page - 1, meta.total_items);
    return `Showing ${start}-${end} of ${meta.total_items} users`;
  };

  if (meta.total_pages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 mt-6">
      {/* Results info and page size selector */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">{getResultsInfo()}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={!meta.has_previous}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          First
        </button>
        
        <button
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={!meta.has_previous}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>

        {getVisiblePages().map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 text-sm border border-gray-300 rounded-md transition-colors ${
              page === meta.current_page
                ? 'bg-pink-500 text-white border-pink-500'
                : 'hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={!meta.has_next}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
        
        <button
          onClick={() => onPageChange(meta.total_pages)}
          disabled={!meta.has_next}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Last
        </button>
      </div>
    </div>
  );
};

// Search Filters Component
interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const [searchQuery, setSearchQuery] = useState(filters.query || '');

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      onFiltersChange({ query: searchQuery || undefined });
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, onFiltersChange]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-4">Find Your Match</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name..."
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        
        <select
          value={filters.gender || ''}
          onChange={(e) => onFiltersChange({ gender: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="">Any Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        
        <input
          type="number"
          value={filters.age_min || ''}
          onChange={(e) => onFiltersChange({ age_min: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Min Age"
          min="18"
          max="100"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        
        <input
          type="number"
          value={filters.age_max || ''}
          onChange={(e) => onFiltersChange({ age_max: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Max Age"
          min="18"
          max="100"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      <div className="flex items-center space-x-4">
        <select
          value={filters.sort || 'created_at'}
          onChange={(e) => onFiltersChange({ sort: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="created_at">Newest</option>
          <option value="fame_rating">Fame Rating</option>
          <option value="first_name">Name</option>
          <option value="last_seen">Last Active</option>
        </select>
        
        <select
          value={filters.order || 'desc'}
          onChange={(e) => onFiltersChange({ order: e.target.value as 'asc' | 'desc' })}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-pink-600 hover:text-pink-800 underline"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

// User Card Component
const UserCard: React.FC<{ user: User }> = ({ user }) => {
  const mainPhoto = user.photos.find(photo => photo.is_main);
  const photoUrl = mainPhoto ? mainPhoto.image_url : '/assets/images/default-avatar.png';

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="aspect-square relative">
        <img 
          src={photoUrl} 
          alt={`${user.first_name} ${user.last_name}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <span 
            className={`inline-block w-3 h-3 rounded-full ${
              user.online_status ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900">
          {user.first_name} {user.last_name}, {user.age}
        </h3>
        <p className="text-gray-600 text-sm">@{user.username}</p>
        
        <div className="flex items-center mt-2">
          <div className="flex text-yellow-400">
            {'★'.repeat(Math.floor(user.fame_rating))}
          </div>
          <span className="ml-2 text-sm text-gray-600">({user.fame_rating})</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {user.hashtags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="inline-block bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
          {user.hashtags.length > 3 && (
            <span className="inline-block text-gray-500 text-xs px-2 py-1">
              +{user.hashtags.length - 3}
            </span>
          )}
        </div>

        <div className="mt-4 flex space-x-2">
          <button 
            onClick={() => console.log('View profile:', user.id)}
            className="flex-1 bg-pink-500 text-white py-2 px-4 rounded-md hover:bg-pink-600 transition-colors"
          >
            View Profile
          </button>
          <button 
            onClick={() => console.log('Like user:', user.id)}
            className="px-4 py-2 border border-pink-500 text-pink-500 rounded-md hover:bg-pink-50 transition-colors"
          >
            ♥
          </button>
        </div>
      </div>
    </div>
  );
};

// Main User List Component
const UserList: React.FC = () => {
  const {
    data,
    loading,
    error,
    pageSize,
    filters,
    updateFilters,
    updatePageSize,
    goToPage,
    refetch
  } = usePagination<User>('/users/search');

  const handleClearFilters = () => {
    updateFilters({
      query: undefined,
      gender: undefined,
      age_min: undefined,
      age_max: undefined,
      sort: 'created_at',
      order: 'desc'
    });
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={refetch}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <SearchFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={handleClearFilters}
      />

      {data && data.data.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💔</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-600">Try adjusting your search filters to find more people.</p>
          <button 
            onClick={handleClearFilters}
            className="mt-4 text-pink-600 hover:text-pink-800 underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.data.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>

          {data && (
            <PaginationControls
              meta={data.meta}
              onPageChange={goToPage}
              pageSize={pageSize}
              onPageSizeChange={updatePageSize}
            />
          )}
        </>
      )}
    </div>
  );
};

export default UserList;

/*
Usage example:

import React from 'react';
import UserList from './components/UserList';

function App() {
  return (
    <div className="App">
      <UserList />
    </div>
  );
}

export default App;
*/
