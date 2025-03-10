/**
 * 解析模块 - 提取页面中的所有链接
 */

import { Hono } from 'hono';
import { renderBt } from '../utils/util';

// http://localhost:8787/parse/https://www.66s6.net/dianshiju/guoju/25614.html

// 支持参数 area="table"&filter=magnet&selector="td a" 的处理

export async function onRequest(context) {
	const { req } = context;
	const url = new URL(req.raw.url);
	const path = url.pathname.replace('/parse/', '');
	const targetUrl = decodeURIComponent(path);

	// 获取查询参数
	const filter = url.searchParams.get('filter');
	let area = url.searchParams.get('area') || 'body';
	let selector = url.searchParams.get('selector') || 'a';
	let type = url.searchParams.get('type') || 'magnet';
	let title = url.searchParams.get('title') || '';
	let description = url.searchParams.get('description') || '';
	// 获取格式化参数
	const formatRegex = url.searchParams.get('formatRegex');
	const formatReplace = url.searchParams.get('formatReplace') || '';

	// 处理引号问题
	area = area.replace(/^["'](.*)["']$/, '$1');
	selector = selector.replace(/^["'](.*)["']$/, '$1');

	// 确保选择器不为空
	if (!area) area = 'body';
	if (!selector) selector = 'a';

	try {
		const response = await fetch(targetUrl);
		const results = [];

		// 创建一个引用存储当前处理的元素索引
		let currentIndex = -1;

		await new HTMLRewriter()
			.on(area + ' ' + selector, {
				element(element) {
					const href = element.getAttribute('href');

					// 如果符合过滤条件，添加到结果
					if (!filter || (filter === 'magnet' && href && href.startsWith('magnet:')) || (href && href.includes(filter))) {
						results.push({
							text: '',
							href: href || '',
						});
						currentIndex = results.length - 1;
					} else {
						currentIndex = -1; // 不符合条件的元素
					}
				},
				text(text) {
					// 只有当前有处理中的元素时才更新文本
					if (currentIndex >= 0 && currentIndex < results.length) {
						results[currentIndex].text += text.text;
					}
				},
			})
			.transform(response)
			.text();

		// 清理结果中的文本并应用格式化
		results.forEach((item) => {
			if (item.text) {
				// 先进行基本的空白字符处理
				item.text = item.text.trim();

				// 如果提供了格式化正则，尝试进行格式化
				if (formatRegex) {
					try {
						const regex = new RegExp(formatRegex, 'g');
						const newText = item.text.replace(regex, formatReplace);
						// 只有当正则匹配成功（文本有变化）时才使用新文本
						if (newText !== item.text) {
							item.text = newText;

							// 如果是magnet链接，同时更新链接中的dn参数
							if (item.href && item.href.startsWith('magnet:')) {
								try {
									const url = new URL(item.href);
									url.searchParams.keys().forEach((key) => {
										if (key.includes('dn')) {
											url.searchParams.delete(key);
										}
									});
									url.searchParams.set('dn', newText);
									item.href = url.toString();
								} catch (e) {
									console.error('处理magnet链接失败:', e);
								}
							}
						}
					} catch (error) {
						// 正则表达式错误，保持原文不变
						console.error('Format regex error:', error);
					}
				}
			}
		});

		const xml = renderBt({
			title: title || results[0].text,
			description,
			link: targetUrl,
			items: results.map((item) => ({
				title: item.text,
				magnet: item.href,
				description: item.text,
				pubDate: new Date().toISOString(),
				category: 'magnet',
			})),
		}).replace(/\n\n+/g, '\n');

		if (type === 'json') {
			return new Response(
				JSON.stringify({
					url: targetUrl,
					area: area,
					selector: selector,
					combined_selector: area + ' ' + selector,
					format_regex: formatRegex,
					format_replace: formatReplace,
					results: results,
					xml,
				}),
				{
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}
		context.header('Content-Type', 'application/xml');
		return context.text(xml);
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: error.message,
				area: area,
				selector: selector,
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}
}

const praseRoute = new Hono();

praseRoute.get('/*', onRequest);

export default praseRoute;
