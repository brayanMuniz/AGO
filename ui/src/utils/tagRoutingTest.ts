// Test file to verify tag routing logic - you can delete this after testing

export function testTagRouting() {
  console.log('Testing tag routing logic...');
  
  const getTagRoute = (tagName: string, category: string): string => {
    const categoryRoutes: { [key: string]: string } = {
      'general': '/tags',
      'character': '/characters',
      'copyright': '/series',
      'artist': '/artists',
      'rating': '/explicitness',
      'meta': '/tags',
      'year': '/tags'
    };

    const basePath = categoryRoutes[category] || '/tags';
    return `${basePath}/${encodeURIComponent(tagName)}`;
  };

  const testCases = [
    { tag: 'raiden_shogun', category: 'character', expected: '/characters/raiden_shogun' },
    { tag: 'genshin_impact', category: 'copyright', expected: '/series/genshin_impact' },
    { tag: 'mihoyo', category: 'artist', expected: '/artists/mihoyo' },
    { tag: 'safe', category: 'rating', expected: '/explicitness/safe' },
    { tag: 'landscape', category: 'general', expected: '/tags/landscape' },
    { tag: '2023', category: 'year', expected: '/tags/2023' },
    { tag: 'high_res', category: 'meta', expected: '/tags/high_res' },
    { tag: 'unknown_tag', category: 'unknown', expected: '/tags/unknown_tag' },
  ];

  testCases.forEach(({ tag, category, expected }) => {
    const result = getTagRoute(tag, category);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} ${category}:${tag} -> ${result} (expected: ${expected})`);
  });
}

// Uncomment to run the test
// testTagRouting();
