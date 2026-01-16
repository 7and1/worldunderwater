export { generateArticle, estimateInputTokens } from "./content-generator";
export type {
  ArticleGenerationInput,
  GeneratedArticle,
} from "./content-generator";

export {
  getProductMatchesForDisaster,
  calculateProductRelevance,
  getRelevanceReason,
} from "./product-matcher";
export type {
  MatchedProduct,
  ProductMatchResult,
  ProductCategory,
} from "./product-matcher";

export {
  evaluateSignificance,
  filterForArticleGeneration,
  getFilterStats,
} from "./significance-filter";
export type {
  ContentDecision,
  SignificanceResult,
  EventForFiltering,
} from "./significance-filter";
