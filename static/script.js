// Global variables
    let selectedFile = null;

    // Initialize application
    document.addEventListener('DOMContentLoaded', function() {
      initializeApp();
    });

    function initializeApp() {
      setupScrollEffects();
      setupAnimations();
      setupFileUpload();
      setupPredictionForm();
      createFloatingOrbs();
    }

    // Scroll effects
    function setupScrollEffects() {
      const header = document.getElementById('header');
      const scrollProgress = document.getElementById('scrollProgress');

      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrolled / maxScroll) * 100;

        // Update scroll progress
        scrollProgress.style.width = progress + '%';

        // Header scroll effect
        if (scrolled > 100) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });
    }

    // Intersection Observer for animations
    function setupAnimations() {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, observerOptions);

      document.querySelectorAll('.fade-up').forEach(el => {
        observer.observe(el);
      });
    }

    // File upload functionality - FIXED
    function setupFileUpload() {
      const dropZone = document.getElementById('dropZone');
      const fileInput = document.getElementById('imageInput');
      const previewImage = document.getElementById('previewImage');

      // Prevent default drag behaviors
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
      });

      // Highlight drop area when item is dragged over it
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
      });

      // Handle dropped files
      dropZone.addEventListener('drop', handleDrop, false);

      // Handle click to select file - FIXED to prevent double trigger
      dropZone.addEventListener('click', (e) => {
        // Only trigger file input if the click is not on the file input itself
        if (e.target !== fileInput) {
          fileInput.click();
        }
      });

      // File input change event
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleFileSelect(e.target.files[0]);
        }
      });

      function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
      }

      function highlight(e) {
        dropZone.classList.add('drag-over');
      }

      function unhighlight(e) {
        dropZone.classList.remove('drag-over');
      }

      function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
          handleFileSelect(files[0]);
        }
      }

      function handleFileSelect(file) {
        if (file && file.type.startsWith('image/')) {
          selectedFile = file; // Store the file globally
          
          const reader = new FileReader();
          reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            
            // Update drop zone appearance
            const dropContent = dropZone.querySelector('.drop-content');
            dropContent.innerHTML = `
              <div class="drop-icon" style="color: var(--success);">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="drop-text">
                <strong style="color: var(--success);">Image uploaded successfully!</strong><br>
                <small>${file.name}</small>
              </div>
            `;
          };
          reader.readAsDataURL(file);
        } else {
          alert('Please select a valid image file.');
        }
      }
    }

    // Prediction form setup - FIXED
    function setupPredictionForm() {
      const predictTrigger = document.getElementById('predictTrigger');
      const predictionForm = document.getElementById('predictionForm');
      const form = document.getElementById('glaucomaForm');

      predictTrigger.addEventListener('click', () => {
        predictionForm.style.display = 'block';
        predictionForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await performPrediction();
      });

      async function performPrediction() {
        const resultContent = document.getElementById('resultContent');
        const submitBtn = document.getElementById('submitBtn');
        const resultCard = document.getElementById('resultCard');

        // Check if file is selected - FIXED
        if (!selectedFile) {
          alert('Please select an image first.');
          return;
        }

        const formData = new FormData();
        formData.append("image", selectedFile);

        // Show loading state
        submitBtn.innerHTML = '<span class="loading"></span> Analyzing...';
        submitBtn.disabled = true;
        resultCard.style.display = 'none';

        try {
          const response = await fetch("http://localhost:5000/predict", {
            method: "POST",
            body: formData
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // Handle the response
          const isPositive = data.result && data.result.toLowerCase().includes("glaucoma");

          resultContent.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
              <h3 style="font-family: 'Space Grotesk', sans-serif; margin-bottom: 0.5rem; font-size: 1.3rem;">
                <i class="fas fa-${isPositive ? 'exclamation-triangle' : 'check-circle'}"></i>
                ${isPositive ? 'Glaucoma Detection' : 'No Glaucoma Detected'}
              </h3>
              <p style="margin-bottom: 1rem;">
                Prediction Result: <strong>${data.result || 'Unknown'}</strong>
              </p>
              ${data.confidence ? `<p>Confidence: <strong>${data.confidence}%</strong></p>` : ''}
            </div>
          `;

          resultCard.className = `result-card ${isPositive ? 'result-positive' : 'result-negative'}`;
          resultCard.style.display = 'block';

          // Scroll to result
          resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Update button text
          submitBtn.innerHTML = '<i class="fas fa-redo"></i> Analyze Another Image';
          submitBtn.disabled = false;

        } catch (error) {
          console.error('Prediction error:', error);
          
          resultContent.innerHTML = `
            <div>
              <h3 style="color: var(--danger); margin-bottom: 1rem;">
                <i class="fas fa-times-circle"></i> Error during prediction
              </h3>
              <p>Please check if your server is running and try again.</p>
              <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
                Error: ${error.message}
              </p>
            </div>
          `;
          
          resultCard.className = 'result-card result-positive';
          resultCard.style.display = 'block';
          
          // Reset button
          submitBtn.innerHTML = '<i class="fas fa-cog"></i> Analyze Image';
          submitBtn.disabled = false;
        }
      }
    }

    // Create floating orbs
    function createFloatingOrbs() {
      const orbsContainer = document.getElementById('orbs');
      if (!orbsContainer) return;
      
      const orbCount = 6;

      for (let i = 0; i < orbCount; i++) {
        const orb = document.createElement('div');
        orb.className = 'orb';
        
        const size = Math.random() * 100 + 50;
        const left = Math.random() * 100;
        const animationDelay = Math.random() * 20;
        
        orb.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          left: ${left}%;
          top: ${Math.random() * 100}%;
          animation-delay: ${animationDelay}s;
        `;
        
        orbsContainer.appendChild(orb);
      }
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Performance optimization: Throttle scroll events
    function throttle(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    // Add some interactive micro-animations
    document.addEventListener('mousemove', throttle((e) => {
      const cards = document.querySelectorAll('.stat-card, .visual-card');
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const cardX = rect.left + rect.width / 2;
        const cardY = rect.top + rect.height / 2;
        
        const distanceX = mouseX - cardX;
        const distanceY = mouseY - cardY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        if (distance < 200) {
          const strength = (200 - distance) / 200;
          const rotateX = (distanceY / 200) * strength * 5;
          const rotateY = (distanceX / 200) * strength * -5;
          
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${strength * 10}px)`;
        } else {
          card.style.transform = '';
        }
      });
    }, 16));

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const form = document.getElementById('predictionForm');
        if (form && form.style.display === 'block') {
          form.style.display = 'none';
        }
      }
    });

    // Reset form functionality - FIXED
    function resetForm() {
      const fileInput = document.getElementById('imageInput');
      const dropZone = document.getElementById('dropZone');
      const previewImage = document.getElementById('previewImage');
      const resultCard = document.getElementById('resultCard');
      const submitBtn = document.getElementById('submitBtn');

      // Clear global file variable
      selectedFile = null;

      // Clear file input
      if (fileInput) {
        fileInput.value = '';
      }

      // Hide preview image
      if (previewImage) {
        previewImage.style.display = 'none';
        previewImage.src = '';
      }

      // Hide result
      if (resultCard) {
        resultCard.style.display = 'none';
      }

      // Reset submit button
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-cog"></i> Analyze Image';
        submitBtn.disabled = false;
      }

      // Restore drop zone content
      if (dropZone) {
        const dropContent = dropZone.querySelector('.drop-content');
        if (dropContent) {
          dropContent.innerHTML = `
            <div class="drop-icon">
              <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <div class="drop-text">
              <strong>Click to upload</strong> or drag and drop<br>
              <small>PNG, JPG, JPEG up to 10MB</small>
            </div>
          `;
        }
      }
    }

    // Auto-reset form when "Analyze Another Image" is clicked
    document.addEventListener('click', (e) => {
      if (e.target.closest('#submitBtn') && e.target.closest('#submitBtn').innerHTML.includes('Analyze Another Image')) {
        resetForm();
      }
    });
