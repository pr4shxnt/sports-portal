import { Link } from "react-router-dom";
import type { NewsPost } from "../../../../store/api";
import { imageUrl } from "../../../../lib/cloudinary";
import { CATEGORY_LABEL, formatDate } from "./newsMeta";

/** Public news card linking to the article. */
const NewsCard = ({
  post,
  slug,
  featured = false,
}: {
  post: NewsPost;
  slug: string;
  featured?: boolean;
}) => (
  <Link
    to={`/champions-league/${slug}/news/${post.slug}`}
    className={`group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[#DD1D25]/60 transition-colors ${featured ? "sm:col-span-2" : ""}`}
  >
    <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
      {post.cover ? (
        <img
          src={imageUrl(
            post.cover.url,
            featured ? 1200 : 640,
            featured ? 675 : 360,
          )}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-zinc-900 to-[#DD1D25]/70 text-4xl">
          ⚽
        </div>
      )}
    </div>
    <div className="p-4 flex-1 flex flex-col">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#DD1D25]">
        {CATEGORY_LABEL[post.category]}
        <span className="text-zinc-400"> · {formatDate(post.publishedAt)}</span>
      </p>
      <h3
        className={`mt-1 font-black leading-snug group-hover:text-[#DD1D25] transition-colors ${featured ? "text-xl sm:text-2xl" : "text-base"}`}
      >
        {post.title}
      </h3>
      {post.summary && (
        <p className="mt-1.5 text-sm text-zinc-500 line-clamp-2">
          {post.summary}
        </p>
      )}
    </div>
  </Link>
);

export default NewsCard;
