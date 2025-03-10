import atomTemplate from '../templates/atom.txt';
import rss2Template from '../templates/rss2.txt';
import btTemplate from '../templates/bt.txt';

import mustache from 'mustache';

let renderAtom = (content) => {
	let renderedText = mustache.render(atomTemplate, content);
	return renderedText;
};

let renderRss2 = (content) => {
	let renderedText = mustache.render(rss2Template, content);
	return renderedText;
};

/**
 * 渲染bt模板
 * @param {{
 *  title: string,
 *  link: string,
 *  description: string,
 *  language: string,    // RSS频道语言
 *  category: string,    // RSS频道分类
 *  items: {
 *    title: string,       // 条目标题
 *    magnet: string,      // Magnet链接（注意这里用magnet而不是link）
 *    description: string  // 条目描述
 *		torrent: string,     // torrent文件URL
 *    pubDate: string,     // 发布时间
 *    guid: string,        // 唯一标识符
 *    author: string,      // 作者
 *    category: string,    // 分类
 *    comments: string,    // 评论URL
 *    source: {           // 来源信息
 *      url: string,      // 来源URL
 *      title: string     // 来源标题
 *    }
 *  }[]
 * }} content 
 */
let renderBt = (content) => {
	let renderedText = mustache.render(btTemplate, content);
	return renderedText;
};

export { renderAtom, renderRss2, renderBt };
