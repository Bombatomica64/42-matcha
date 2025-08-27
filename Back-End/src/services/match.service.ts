import { pool } from "../database";
import { MatchRepository } from "@repositories/match.repository";
import { LikeRepository } from "@repositories/like.repository";
import { BlockRepository } from "@repositories/block.repository";
import { UserRepository } from "@repositories/user.repository";
import type { Match, MatchWithUser } from "@repositories/match.repository";

export class MatchService {
  private matchRepository: MatchRepository;
  private likeRepository: LikeRepository;
  private blockRepository: BlockRepository;
  private userRepository: UserRepository;

  constructor() {
    this.matchRepository = new MatchRepository(pool);
    this.likeRepository = new LikeRepository(pool);
    this.blockRepository = new BlockRepository(pool);
    this.userRepository = new UserRepository(pool);
  }

  /**
   * Get user matches with pagination
   */
  async getUserMatches(userId: string, page = 1, limit = 20): Promise<{
    matches: MatchWithUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const offset = (page - 1) * limit;
    const matches = await this.matchRepository.getUserMatches(userId, limit + 1, offset);
    
    // Get total count
    const total = await this.matchRepository.getUserMatchCount(userId);
    
    const hasNext = matches.length > limit;
    const actualMatches = hasNext ? matches.slice(0, -1) : matches;

    return {
      matches: actualMatches,
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
   * Check if two users are matched
   */
  async areUsersMatched(user1Id: string, user2Id: string): Promise<boolean> {
    return this.matchRepository.areUsersMatched(user1Id, user2Id);
  }

  /**
   * Remove a match (unmatch)
   */
  async removeMatch(user1Id: string, user2Id: string): Promise<{
    success: boolean;
    reason?: string;
  }> {
    // Check if users are actually matched
    const isMatched = await this.areUsersMatched(user1Id, user2Id);
    if (!isMatched) {
      return {
        success: false,
        reason: "Users are not matched"
      };
    }

    // Remove the match
    const removed = await this.matchRepository.removeMatch(user1Id, user2Id);
    
    if (removed) {
      // Update match counts for both users
      await Promise.all([
        this.matchRepository.updateUserMatchCount(user1Id),
        this.matchRepository.updateUserMatchCount(user2Id)
      ]);
    }

    return {
      success: removed,
      reason: removed ? undefined : "Failed to remove match"
    };
  }
}

export default MatchService;