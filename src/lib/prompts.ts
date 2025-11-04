export const prompts = {
  url: (serviceName: string) =>
    `URL of the platform "${serviceName}". Respond only with the complete URL, e.g., https://agent.ai. No explanations, no warnings. Just the URL.`,

  description: (serviceName: string) =>
    `Write a short description (100-200 words) of the service / the app: ${serviceName}. 

The text should have 3-4 subheadings. 

Please use Markdown, but only use heading formatting. 

The first heading should be on the second level (##), all others should be on the third level (###).

Please only output the Markdown, no additional text around it. Please only output the pure Markdown, do not surround it with \`\`\`markdown and \`\`\``,

  abstract: (serviceName: string) =>
    `Write a short descriptive sentence (60–120 characters) without an article at the beginning of the sentence and without mentioning the name again, referring to the following service: ${serviceName}`,

  functionality: (serviceName: string) =>
    `Create a concise list of 3–8 important functions and uses as bullet points for the following internet service/app: ${serviceName}. The list should clearly convey the core characteristics, categories, and top features for users so that they can understand at a glance what the service is suitable for. 

The list should NOT list content offered by the platform, but rather features and uses.

Example for Canva:

* User-friendly design templates
* Diverse fonts and color palettes
* Simple drag-and-drop functionality
* Large selection of free stock photos
* Ability to collaborate in a team
* Customizable infographics and charts

Please create the answer in pure Markdown, but only use list markers.

Please only output the Markdown, no additional text around it. Please only output the pure Markdown, do not surround it with \`\`\`markdown and \`\`\`


Now create such a list for ${serviceName}.`,

  shortfacts: (serviceName: string) =>
    `In a short, coherent sentence (100-200 characters), list the most important facts about the app ${serviceName} that are of interest to users. Write in a professional journalistic style, using commas to separate information.`,

  pricing: (serviceName: string) =>
    `pricing of service ${serviceName}: in the form of a markdown table. state pricing categories, a short description if you have the price. If there is a free usage possible, include this (write "free" instead of $0). 

Language: English

No more text, introduction, or other words. Just the markdown table. nothing else. 

If you don't find a pricing, just state nothing.`,

  tags: (serviceName: string, availableTags: string) =>
    `I run a website that catalogs all kinds of internet services and organizes them by tags.

This is the global tag list: ${availableTags}

Now search this list for suitable tags for the app/service ${serviceName}. If only one really fits, use only that one. If several fit, use several. There should not be more than 6. There can also be fewer. Only tags that describe the core function of the service or app should be used, not any secondary functions.

Output the tags without any additional text, separated by commas!`,

  youtubeVideo: (serviceName: string, videosJson: string) =>
    `Here is a list of YouTube videos:

${videosJson}

---

Return the video that best suits introducing a user to the app/service "${serviceName}".

Only return the video. Return the complete JSON for the video. Make sure to return the complete JSON. The JSON must be valid! And only return the JSON, no text, no explanation, no punctuation. No Markdown, no embedding in \`\`\``
}
