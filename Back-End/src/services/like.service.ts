import { pool } from "../database";
import { LikeRepository } from "@repositories/like.repository";
import { MatchRepository } from "@repositories/match.repository";
import type { UserLike, CreateLikeData, LikeStats } from "@repositories/like.repository";

export class LikeService {
  private likeRepository: LikeRepository;
  private matchRepository: MatchRepository;

  constructor() {
    this.likeRepository = new LikeRepository(pool);
    this.matchRepository = new MatchRepository(pool);
  }

  /**
   * Like or dislike a user
   */
  async likeUser(likerId: string, likedId: string, isLike: boolean): Promise<{
    like: UserLike;
    isMatch: boolean;
    matchId?: string;
  }> {
    // Validate: User can't like themselves
    if (likerId === likedId) {
      throw new Error("Users cannot like themselves");
    }

    // Check rate limiting
    const canLike = await this.likeRepository.checkLikeRateLimit(likerId);
    if (!canLike) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    // Create or update the like
    const likeData: CreateLikeData = {
      liker_id: likerId,
      liked_id: likedId,
      is_like: isLike
    };

    const like = await this.likeRepository.createOrUpdateLike(likeData);

    // Update the liked user's like count
    await this.likeRepository.updateUserLikeCount(likedId);

    // Check for mutual like and create match if it exists
    let isMatch = false;
    let matchId: string | undefined;

    if (isLike) {
      const isMutual = await this.likeRepository.checkMutualLike(likerId, likedId);
      
      if (isMutual) {
        // Create a match
        const match = await this.matchRepository.createMatch(likerId, likedId);
        isMatch = true;
        matchId = match.id;
      }
    }

    return {
      like,
      isMatch,
      matchId
    };
  }

  /**
   * Remove a like (unlike)
   */
  async unlikeUser(likerId: string, likedId: string): Promise<boolean> {
    const removed = await this.likeRepository.removeLike(likerId, likedId);
    
    if (removed) {
      // Update like count
      await this.likeRepository.updateUserLikeCount(likedId);
      
      // TODO: Handle match removal if this breaks a mutual like
      // This depends on your business logic - do you want to keep matches even if someone unlikes?
    }

    return removed;
  }

  /**
   * Get users who liked the given user
   */
  async getUserLikes(userId: string, page = 1, limit = 20): Promise<{
    likes: UserLike[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;
    const likes = await this.likeRepository.getUsersWhoLikedUser(userId, limit + 1, offset);
    
    // Get total count for pagination
    const stats = await this.likeRepository.getLikeStats(userId);
    const total = stats.total_likes;
    
    const hasNext = likes.length > limit;
    const actualLikes = hasNext ? likes.slice(0, -1) : likes;

    return {
      likes: actualLikes,
      pagination: {
        page,
        limit,
        total,
        hasNext,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get users that the given user has liked
   */
  async getUserLikedBy(userId: string, page = 1, limit = 20): Promise<{
    likes: UserLike[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;
    const likes = await this.likeRepository.getUsersLikedByUser(userId, limit + 1, offset);
    
    // Count total likes given by user
    const countQuery = `
      SELECT COUNT(*) as count FROM user_likes 
      WHERE liker_id = $1 AND is_like = true
    `;
    const countResult = await this.likeRepository.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].count);
    
    const hasNext = likes.length > limit;
    const actualLikes = hasNext ? likes.slice(0, -1) : likes;

    return {
      likes: actualLikes,
      pagination: {
        page,
        limit,
        total,
        hasNext,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get like statistics for a user
   */
  async getLikeStats(userId: string): Promise<LikeStats> {
    return this.likeRepository.getLikeStats(userId);
  }

  /**
   * Check like status between two users
   */
  async getLikeStatus(likerId: string, likedId: string): Promise<{
    userLiked: boolean;
    likedBack: boolean;
    isMatch: boolean;
  }> {
    // Check if liker liked the target
    const userLike = await this.likeRepository.getLikeBetweenUsers(likerId, likedId);
    const userLiked = userLike?.is_like === true;

    // Check if target liked back
    const targetLike = await this.likeRepository.getLikeBetweenUsers(likedId, likerId);
    const likedBack = targetLike?.is_like === true;

    const isMatch = userLiked && likedBack;

    return {
      userLiked,
      likedBack,
      isMatch
    };
  }

  /**
   * Get recent like activity for recommendations
   */
  async getRecentActivity(userId: string, days = 7): Promise<UserLike[]> {
    return this.likeRepository.getRecentLikeActivity(userId, days);
  }
}
