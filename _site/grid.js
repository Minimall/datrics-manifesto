class GridAnimation {
    constructor(options = {}) {
        this.calculateGridDimensions();
        this.dots = [];
        this.autoWaveActive = options.autoStart !== false; // Default to true unless explicitly set to false
        this.autoWaveInterval = null;
        this.colors = ['blue', 'red', 'lime', 'pink'];
        this.patternTypes = ['ripple', 'cascade', 'wave']; // Removed flash and spiral
        this.currentMode = options.autoStart !== false ? 'auto' : 'idle';
        this.isAnimating = false;
        this.animationQueue = [];
        this.resetTimeout = null;
        
        // Color randomization system
        this.useSequentialColors = false;
        this.currentColorSet = [];
        
        // Get default dot attributes from CSS
        this.defaultDotAttributes = this.getDefaultDotAttributes();
        
        this.init(options);
    }

    getDefaultDotAttributes() {
        // Get the animation section to read CSS custom properties
        const animationSection = document.querySelector('.animation-section');
        if (!animationSection) {
            // Fallback values if CSS is not available
            return {
                backgroundColor: '#eef3f6',
                opacity: '0.3',
                scale: '1',
                boxShadow: '0 0 0px rgba(0,0,0,0)'
            };
        }
        
        const computedStyle = window.getComputedStyle(animationSection);
        
        // Get the CSS custom property values and resolve them
        let backgroundColor = computedStyle.getPropertyValue('--dot-default-bg').trim();
        
        // If the background color is a CSS variable reference, resolve it
        if (backgroundColor.startsWith('var(')) {
            // Extract the variable name from var(--variable-name)
            const varMatch = backgroundColor.match(/var\(([^)]+)\)/);
            if (varMatch) {
                const varName = varMatch[1].trim();
                backgroundColor = computedStyle.getPropertyValue(varName).trim();
            }
        }
        
        return {
            backgroundColor: backgroundColor || '#eef3f6',
            opacity: computedStyle.getPropertyValue('--dot-default-opacity').trim() || '0.3',
            scale: computedStyle.getPropertyValue('--dot-default-scale').trim() || '1',
            boxShadow: computedStyle.getPropertyValue('--dot-default-shadow').trim() || '0 0 0px rgba(0,0,0,0)'
        };
    }

    calculateGridDimensions() {
        const container = document.querySelector('.animation-section');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Create a temporary dot to measure actual CSS values
        const tempDot = document.createElement('div');
        tempDot.className = 'dot';
        tempDot.style.visibility = 'hidden';
        tempDot.style.position = 'absolute';
        container.appendChild(tempDot);
        
        // Get computed styles
        const computedStyle = window.getComputedStyle(tempDot);
        let dotSize = parseFloat(computedStyle.width);
        
        // Fallback if computed style is not available
        if (!dotSize || isNaN(dotSize)) {
            dotSize = containerWidth <= 480 ? 8 : containerWidth <= 768 ? 10 : 12;
        }
        
        // Remove temp dot
        container.removeChild(tempDot);
        
        // Create temp grid to measure gap
        const tempGrid = document.createElement('div');
        tempGrid.className = 'dots-grid';
        tempGrid.style.visibility = 'hidden';
        tempGrid.style.position = 'absolute';
        container.appendChild(tempGrid);
        
        const gridStyle = window.getComputedStyle(tempGrid);
        let gap = parseFloat(gridStyle.gap);
        
        // Fallback if computed gap is not available
        if (!gap || isNaN(gap)) {
            gap = containerWidth <= 480 ? 12 : containerWidth <= 768 ? 14 : 16;
        }
        
        container.removeChild(tempGrid);
        
        // Target gap should be close to 16px, but respect CSS responsive values
        // Calculate how many dots can fit with the actual CSS gap
        this.cols = Math.floor((containerWidth + gap) / (dotSize + gap));
        this.rows = Math.floor((containerHeight + gap) / (dotSize + gap));
        
        // Ensure minimum grid size for visual appeal
        this.cols = Math.max(this.cols, 8);
        this.rows = Math.max(this.rows, 6);
        
        // Store these values for use in createGrid
        this.dotSize = dotSize;
        this.gap = gap;
        this.totalDots = this.cols * this.rows;
    }

    init(options = {}) {
        this.createGrid();
        this.bindEvents();
        
        // Only start auto patterns if autoStart is not explicitly set to false
        if (options.autoStart !== false) {
            this.startAutoPatterns();
        }
    }

    createGrid() {
        const grid = document.getElementById('dotsGrid');
        grid.innerHTML = '';
        this.dots = [];
        
        // Use actual dot size for grid template instead of 1fr
        // This ensures the grid respects the CSS-defined dot sizes and gaps
        grid.style.gridTemplateColumns = `repeat(${this.cols}, ${this.dotSize}px)`;
        grid.style.gridTemplateRows = `repeat(${this.rows}, ${this.dotSize}px)`;
        
        // Center the grid within the container
        grid.style.justifyContent = 'center';
        grid.style.alignContent = 'center';
        
        for (let i = 0; i < this.totalDots; i++) {
            const dot = document.createElement('div');
            
            // Randomly assign color for animation variety
            const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
            
            dot.className = 'dot';
            dot.dataset.index = i;
            dot.dataset.x = i % this.cols;
            dot.dataset.y = Math.floor(i / this.cols);
            dot.dataset.color = randomColor;
            
            grid.appendChild(dot);
            this.dots.push(dot);
        }
    }

    bindEvents() {
        // Resize handler with debouncing for better performance
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const oldCols = this.cols;
                const oldRows = this.rows;
                this.calculateGridDimensions();
                
                if (oldCols !== this.cols || oldRows !== this.rows) {
                    this.createGrid();
                    // Restart patterns after resize only if auto mode was active
                    this.stopAutoWave();
                    if (this.currentMode === 'auto') {
                        this.startAutoPatterns();
                    }
                }
            }, 150); // Debounce resize events
        });
    }

    clearAllAnimations() {
        this.isAnimating = false;
        this.animationQueue = [];
        
        // Clear any pending reset timeout
        if (this.resetTimeout) {
            clearTimeout(this.resetTimeout);
            this.resetTimeout = null;
        }
        
        // Reset symmetry pattern for next use
        this.currentSymmetryPattern = null;
        
        // Stop auto wave scheduling
        this.scheduleNextPattern = null;
        
        // Clear all Motion One animations and reset styles
        this.dots.forEach(dot => {
            // Stop any running Motion One animations
            if (dot._motionAnimation) {
                dot._motionAnimation.stop();
                delete dot._motionAnimation;
            }
            
            // Reset to default state using CSS values
            dot.style.backgroundColor = this.defaultDotAttributes.backgroundColor;
            dot.style.opacity = this.defaultDotAttributes.opacity;
            dot.style.transform = `scale(${this.defaultDotAttributes.scale})`;
            dot.style.boxShadow = this.defaultDotAttributes.boxShadow;
        });
    }

    triggerWave(centerX, centerY, patternType = 'ripple') {
        // Prevent overlapping animations
        if (this.isAnimating && this.currentMode !== 'auto') {
            return;
        }
        
        // Store symmetry pattern if it's a symmetry type before clearing
        const preservedSymmetryPattern = patternType === 'symmetry' ? this.currentSymmetryPattern : null;
        
        // Clear any existing animations before starting new ones
        this.clearAllAnimations();
        
        // Restore symmetry pattern if it was preserved
        if (preservedSymmetryPattern !== null) {
            this.currentSymmetryPattern = preservedSymmetryPattern;
        }
        
        // Randomize color settings for this animation
        this.randomizeColorSettings();
        
        this.isAnimating = true;
        const maxDistance = Math.sqrt(Math.pow(this.cols, 2) + Math.pow(this.rows, 2));
        let maxDelay = 0;
        
        this.dots.forEach((dot, index) => {
            const x = parseInt(dot.dataset.x);
            const y = parseInt(dot.dataset.y);
            
            let delay = 0;
            let shouldActivate = false;
            
            switch(patternType) {
                case 'ripple':
                    // Ring-shaped ripple effect with smooth wave propagation
                    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                    const ringThickness = 1.5;
                    const ringRadius = Math.floor(distance);
                    delay = ringRadius * 120; // Smoother timing
                    shouldActivate = Math.abs(distance - ringRadius) < ringThickness;
                    break;
                    
                case 'cascade':
                    // Diagonal cascade with smooth wave progression
                    delay = (x + y) * 80; // Smoother timing
                    shouldActivate = true;
                    break;
                    
                case 'wave':
                    // New creative wave pattern - sine wave propagation
                    const waveDistance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                    const wavePhase = Math.sin(waveDistance * 0.5) * 0.5 + 0.5;
                    delay = waveDistance * 100 + wavePhase * 200;
                    shouldActivate = true;
                    break;
                    
                case 'symmetry':
                    // Improved symmetrical patterns with precise geometric shapes
                    shouldActivate = this.isOnSymmetricalPattern(x, y, centerX, centerY);
                    const symmetryDistance = Math.max(Math.abs(x - centerX), Math.abs(y - centerY));
                    delay = symmetryDistance * 100; // Smooth outward progression
                    break;
            }
            
            if (shouldActivate) {
                // Apply color logic
                if (this.useSequentialColors) {
                    // Use sequential colors based on pattern-specific logic
                    let colorIndex;
                    switch(patternType) {
                        case 'wave':
                            const waveDistance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                            colorIndex = Math.floor(waveDistance / 2) % this.currentColorSet.length;
                            break;
                        case 'ripple':
                            const rippleDistance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                            colorIndex = Math.floor(rippleDistance) % this.currentColorSet.length;
                            break;
                        case 'cascade':
                            colorIndex = (x + y) % this.currentColorSet.length;
                            break;
                        case 'symmetry':
                            const symDistance = Math.max(Math.abs(x - centerX), Math.abs(y - centerY));
                            colorIndex = symDistance % this.currentColorSet.length;
                            break;
                        default:
                            colorIndex = Math.floor(Math.random() * this.currentColorSet.length);
                    }
                    dot.dataset.color = this.currentColorSet[colorIndex];
                } else {
                    // Use random color for each dot (original behavior)
                    const randomColor = this.colors[Math.floor(Math.random() * this.colors.length)];
                    dot.dataset.color = randomColor;
                }
                
                // Schedule animation
                maxDelay = Math.max(maxDelay, delay);
                
                setTimeout(() => {
                    // Use Motion One for smooth animations without scale/bounce
                    this.animateDotWithMotion(dot, dot.dataset.color);
                }, delay);
            }
        });
        
        // Calculate when ALL dots will finish their animations
        const animationDuration = 2800; // Each dot animation duration (Motion One with scaling)
        const totalAnimationTime = maxDelay + animationDuration; // When last dot finishes
        
        // Step 1: Wait for all animations to complete
        this.resetTimeout = setTimeout(() => {
            // Step 2: All dots have returned to default state
            this.isAnimating = false;
            
            // Step 3: Schedule next animation after 2-second pause
            if (this.autoWaveActive && this.scheduleNextPattern) {
                this.scheduleNextPattern();
            }
        }, totalAnimationTime);
    }

    animateDotWithMotion(dot, color) {
        // Check if Motion One is available
        if (typeof Motion === 'undefined') {
            console.warn('Motion One library not loaded, falling back to simple style changes');
            // Fallback to simple style changes
            dot.style.backgroundColor = '#3b63ff';
            dot.style.opacity = '1';
            setTimeout(() => {
                dot.style.backgroundColor = this.defaultDotAttributes.backgroundColor;
                dot.style.opacity = this.defaultDotAttributes.opacity;
                dot.style.transform = `scale(${this.defaultDotAttributes.scale})`;
            }, 2800);
            return;
        }
        
        // Define color mappings from CSS variables
        const colorMap = {
            'blue': { primary: '#3b63ff', secondary: '#3b63ff' },
            'red': { primary: '#e7360c', secondary: '#e7360c' },
            'lime': { primary: '#97e617', secondary: '#97e617' },
            'pink': { primary: '#f026d3', secondary: '#f026d3' }
        };
        
        const colors = colorMap[color] || colorMap['blue'];
        const { animate } = Motion;
        
        // Create a fluid animation with synchronized scaling and color changes
        // Using a two-phase approach for more natural spring-like motion
        
        // Phase 1: Quick expansion with color change
        const expandAnimation = animate(
            dot,
            {
                backgroundColor: colors.primary,
                opacity: 1,
                scale: 1.4,
                boxShadow: `0 0 4px ${colors.primary}50`
            },
            {
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1], // Overshoot easing for spring effect
            }
        );
        
        // Phase 2: Gentle settle and fade out with damping
        expandAnimation.then(() => {
            return animate(
                dot,
                {
                    backgroundColor: this.defaultDotAttributes.backgroundColor,
                    opacity: parseFloat(this.defaultDotAttributes.opacity) + 0.1, // Slightly higher than default for smooth transition
                    scale: parseFloat(this.defaultDotAttributes.scale),
                    boxShadow: this.defaultDotAttributes.boxShadow
                },
                {
                    duration: 2.0,
                    ease: [0.25, 0.46, 0.45, 0.94], // Smooth damped return
                }
            );
        });
        
        const animation = expandAnimation;
        
        // Store animation reference for cleanup
        dot._motionAnimation = animation;
        
        return animation;
    }

    isOnSymmetricalPattern(x, y, centerX, centerY) {
        // Create precise geometric symmetrical patterns
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Store pattern index in instance to maintain consistency during animation
        if (!this.currentSymmetryPattern && this.currentSymmetryPattern !== 0) {
            this.currentSymmetryPattern = Math.floor(Math.random() * 11); // Reduced from 12 to 11
        }
        
        switch(this.currentSymmetryPattern) {
            case 0: // Perfect Cross - Extended to fill grid
                return x === centerX || y === centerY;
                
            case 1: // Diagonal Cross - Extended to fill grid
                return Math.abs(dx) === Math.abs(dy);
                
            case 2: // Concentric Squares - More rings to fill grid
                const squareDistance = Math.max(Math.abs(dx), Math.abs(dy));
                return squareDistance % 2 === 0 && squareDistance <= Math.max(this.cols, this.rows) / 2;
                
            case 3: // Diamond Pattern - Repeated diamonds to fill grid
                const diamondDistance = Math.abs(dx) + Math.abs(dy);
                return diamondDistance % 3 === 0 && diamondDistance <= Math.max(this.cols, this.rows);
                
            case 4: // 8-Point Star - Extended rays
                return (x === centerX || y === centerY || Math.abs(dx) === Math.abs(dy) ||
                       Math.abs(dx) === 2 * Math.abs(dy) || Math.abs(dy) === 2 * Math.abs(dx));
                
            case 5: // Circular Rings - More rings to fill grid
                const ringDistance = Math.round(distance);
                return ringDistance % 2 === 1 && ringDistance <= Math.max(this.cols, this.rows) / 2;
                
            case 6: // Grid Pattern - Extended to fill entire grid
                return (dx % 3 === 0 && dy % 3 === 0);
                
            case 7: // Snowflake Pattern - Extended
                const snowAngle = Math.atan2(dy, dx);
                return (Math.abs(dx) === Math.abs(dy) || x === centerX || y === centerY ||
                       Math.abs(dx) === 2 * Math.abs(dy) || Math.abs(dy) === 2 * Math.abs(dx) ||
                       Math.cos(snowAngle * 6) > 0.7);
                
            case 8: // Aztec Pattern - Extended to fill grid
                const aztecX = Math.abs(dx);
                const aztecY = Math.abs(dy);
                return ((aztecX + aztecY) % 3 === 0) ||
                       (aztecX === aztecY) ||
                       ((aztecX % 4 === 2) || (aztecY % 4 === 2));
                
            case 9: // NEW: Checkerboard Pattern
                return (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0;
                
            case 10: // NEW: Spiral Arms
                const spiralAngle = Math.atan2(dy, dx);
                const spiralRadius = Math.sqrt(dx * dx + dy * dy);
                const spiralArm = (spiralAngle + spiralRadius * 0.3) % (2 * Math.PI / 3);
                return Math.abs(Math.sin(spiralArm * 3)) > 0.8 || 
                       Math.abs(Math.sin(spiralArm * 3 + Math.PI)) > 0.8 ||
                       Math.abs(Math.sin(spiralArm * 3 + 2 * Math.PI / 3)) > 0.8;
                
            default:
                return x === centerX || y === centerY;
        }
    }

    shuffleArray(array) {
        // Fisher-Yates shuffle algorithm
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    randomizeColorSettings() {
        // Randomly decide whether to use sequential colors (50% chance)
        this.useSequentialColors = Math.random() < 0.5;
        
        if (this.useSequentialColors) {
            // Create a randomized color set with 2-4 colors
            const availableColors = [...this.colors];
            this.shuffleArray(availableColors);
            
            // Use 2-4 colors randomly
            const colorCount = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4 colors
            this.currentColorSet = availableColors.slice(0, colorCount);
        } else {
            // Reset to use random colors for each dot
            this.currentColorSet = [];
        }
    }

    startAutoPatterns() {
        this.autoWaveActive = true;
        
        // Generate random start points for ripple patterns
        const getRandomPoint = () => ({
            x: Math.floor(Math.random() * this.cols),
            y: Math.floor(Math.random() * this.rows)
        });
        
        const centerPoint = { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) };
        const ripplePoint1 = getRandomPoint();
        const ripplePoint2 = getRandomPoint();
        
        // Increase symmetry frequency by 20% - add more symmetry patterns
        const patterns = [
            () => this.triggerWave(ripplePoint1.x, ripplePoint1.y, 'ripple'),
            () => this.triggerWave(this.cols - 1, 0, 'cascade'),
            () => this.triggerWave(ripplePoint2.x, ripplePoint2.y, 'ripple'),
            () => this.triggerWave(centerPoint.x, centerPoint.y, 'symmetry'),
            () => this.triggerWave(Math.floor(this.cols / 4), Math.floor(this.rows / 4), 'wave'),
            () => this.triggerWave(centerPoint.x, centerPoint.y, 'symmetry'), // Extra symmetry
            () => this.triggerDiagonalCascade(),
            () => this.triggerWavePattern(),
            () => this.triggerWave(centerPoint.x, centerPoint.y, 'symmetry'), // Extra symmetry
            () => this.triggerSymmetryShowcase(),
        ];
        
        // Randomize the order of patterns each time page loads
        this.shuffleArray(patterns);
        
        let patternIndex = 0;
        
        // Start first animation immediately
        if (patterns.length > 0) {
            patterns[patternIndex]();
            patternIndex = (patternIndex + 1) % patterns.length;
        }
        
        // Use a more robust interval-based approach
        const runNextPattern = () => {
            if (!this.autoWaveActive) return;
            
            if (!this.isAnimating) {
                patterns[patternIndex]();
                patternIndex = (patternIndex + 1) % patterns.length;
            }
        };
        
        // Start the interval-based animation loop
        this.autoWaveInterval = setInterval(runNextPattern, 8000); // Check every 8 seconds
        
        // Keep the scheduleNextPattern for compatibility but make it simpler
        this.scheduleNextPattern = () => {
            // This is now just a backup - the main loop is handled by setInterval
            if (!this.autoWaveActive) return;
        };
    }

    stopAutoWave() {
        this.autoWaveActive = false;
        if (this.autoWaveInterval) {
            clearInterval(this.autoWaveInterval);
            this.autoWaveInterval = null;
        }
        this.scheduleNextPattern = null;
    }

    triggerSymmetryShowcase() {
        // Showcase a single random symmetry pattern instead of multiple
        const centerX = Math.floor(this.cols / 2);
        const centerY = Math.floor(this.rows / 2);
        
        // Choose one random symmetry pattern from the most interesting ones
        const patterns = [0, 2, 4, 7, 9, 10]; // Cross, Squares, Star, Snowflake, Checkerboard, Spiral Arms
        const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        this.currentSymmetryPattern = randomPattern;
        this.triggerWave(centerX, centerY, 'symmetry');
    }

    triggerSpecificSymmetry(patternIndex) {
        // Trigger a specific symmetry pattern
        const centerX = Math.floor(this.cols / 2);
        const centerY = Math.floor(this.rows / 2);
        
        this.currentSymmetryPattern = patternIndex;
        this.triggerWave(centerX, centerY, 'symmetry');
    }

    getSymmetryPatternNames() {
        // Return array of symmetry pattern names for UI
        return [
            'Perfect Cross',
            'Diagonal Cross', 
            'Concentric Squares',
            'Diamond Pattern',
            '8-Point Star',
            'Circular Rings',
            'Grid Pattern',
            'Snowflake Pattern',
            'Aztec Pattern',
            'Checkerboard Pattern',
            'Spiral Arms'
        ];
    }

    triggerDiagonalCascade() {
        // Diagonal cascade pattern
        this.triggerWave(0, 0, 'cascade');
    }

    triggerWavePattern() {
        // Single wave pattern from a random starting point
        const waveConfigs = [
            // Horizontal wave from left
            { x: 0, y: Math.floor(this.rows / 2) },
            // Vertical wave from top
            { x: Math.floor(this.cols / 2), y: 0 },
            // Diagonal wave from top-left
            { x: 0, y: 0 },
            // Center explosion
            { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) },
        ];
        
        // Choose one random wave configuration
        const randomConfig = waveConfigs[Math.floor(Math.random() * waveConfigs.length)];
        this.triggerWave(randomConfig.x, randomConfig.y, 'wave');
    }
}

// Initialize when DOM is loaded and Motion One is available
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Motion One to load if needed
    const initializeWave = () => {
        if (typeof Motion !== 'undefined') {
            console.log('Motion One loaded successfully');
            window.gridAnimation = new GridAnimation();
        } else {
            console.log('Motion One not yet loaded, retrying...');
            setTimeout(initializeWave, 100);
        }
    };
    
    initializeWave();
}); 