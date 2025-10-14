import { PostData } from "../../../types/post/post.type";
import { postCategories, prepositions } from "./postCategory";


export class Filter {
    static post(postData: PostData) {
        const prepositionsSet = new Set(prepositions);

        if (!postData.caption) return postData;

        const tagsFromCaption = postData.caption.match(/#[a-zA-Z0-9_]+/g) || [];

        const tagSet = new Set(tagsFromCaption.map(tag => tag.toLowerCase()));

        const categoryScore: Record<string, number> = {};

        for (const category of Object.keys(postCategories)) {
            categoryScore[category] = 0;
        }

        const captionWords = postData.caption
            .toLowerCase()
            .split(/[\s,!.?]+/)
            .filter(Boolean)
            .filter(word => !prepositionsSet.has(word));

        for (const [category, words] of Object.entries(postCategories)) {
            const wordSet = new Set(words);
            for (const word of captionWords) {
                if (wordSet.has(word)) categoryScore[category]++;
            }
        }

        const sortedCategories = Object.entries(categoryScore)
            .sort((a, b) => b[1] - a[1])
            .filter(([_, score]) => score > 0)
            .map(([category]) => `#${category}`);

        const finalTags = Array.from(new Set([...tagSet, ...sortedCategories]));

        const average = this.getAverage(categoryScore)

        postData.tags = finalTags;
        postData.aiScore = average;
        console.log(postData);

        return postData;
    }

    private static getAverage(categoryScore: Record<string, number>) {
        const positiveScores = Object.entries(categoryScore).filter(([_, score]) => score > 0);

        const total = positiveScores.reduce((sum, [_, score]) => sum + score, 0);

        const normalizedScores = Object.fromEntries(
            positiveScores.map(([category, score]) => [category, +(score / total).toFixed(2)])
        );

        return normalizedScores;
    }
}

