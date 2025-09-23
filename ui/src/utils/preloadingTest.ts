// Test file to verify preloading logic - you can delete this after testing

export function testPreloadingLogic() {
  console.log('Testing preloading logic...');
  
  const testCases = [
    { currentIndex: 0, totalImages: 20, desc: 'Start of list' },
    { currentIndex: 1, totalImages: 20, desc: 'Near start' },
    { currentIndex: 10, totalImages: 20, desc: 'Middle of list' },
    { currentIndex: 18, totalImages: 20, desc: 'Near end' },
    { currentIndex: 19, totalImages: 20, desc: 'End of list' },
    { currentIndex: 0, totalImages: 3, desc: 'Small list - start' },
    { currentIndex: 1, totalImages: 3, desc: 'Small list - middle' },
    { currentIndex: 2, totalImages: 3, desc: 'Small list - end' },
  ];

  testCases.forEach(({ currentIndex, totalImages, desc }) => {
    console.log(`\n--- ${desc} (index ${currentIndex} of ${totalImages}) ---`);
    
    // Simulate the preloading logic
    const imagesToPreload: number[] = [];
    
    // Preload next 5 images (or remaining images if less than 5)
    const nextCount = Math.min(5, totalImages - currentIndex - 1);
    for (let i = 1; i <= nextCount; i++) {
      imagesToPreload.push(currentIndex + i);
    }
    
    // Preload previous 5 images (or available images if less than 5)
    const prevCount = Math.min(5, currentIndex);
    for (let i = 1; i <= prevCount; i++) {
      imagesToPreload.push(currentIndex - i);
    }
    
    console.log(`Next ${nextCount} images:`, Array.from({length: nextCount}, (_, i) => currentIndex + i + 1));
    console.log(`Previous ${prevCount} images:`, Array.from({length: prevCount}, (_, i) => currentIndex - i - 1));
    console.log(`Total preloaded: ${imagesToPreload.length} images`);
    console.log(`Preloaded indices:`, imagesToPreload.sort((a, b) => a - b));
  });
}

// Uncomment to run the test
// testPreloadingLogic();
