let model, webcamStream;

// Load BlazeFace model
async function loadModel() {
    model = await blazeface.load();
    console.log("✅ Model loaded");
}
loadModel();

// Navigation
function showSection(sectionName) {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('faceScanSection').classList.remove('active');
    document.getElementById('hairstylesSection').classList.remove('active');
    if (sectionName === 'faceScan') {
        document.getElementById('faceScanSection').classList.add('active');
    } else if (sectionName === 'hairstyles') {
        document.getElementById('hairstylesSection').classList.add('active');
    }
}

function showMainMenu() {
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('faceScanSection').classList.remove('active');
    document.getElementById('hairstylesSection').classList.remove('active');
}

// Start scan button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('start--Scan').addEventListener('click', startFaceDetection);

    // Hairstyle cards AI preview
    document.querySelectorAll('.hairstyle-card').forEach(card => {
        card.addEventListener('click', function () {
            const name = this.querySelector('.hairstyle-name').textContent;
            showNotification(`${name} selected!`);
            show3DPreview(name);
        });
    });

    // Arrows for navigation
    document.getElementById('nav-left').addEventListener('click', () => scrollGallery(-1));
    document.getElementById('nav-right').addEventListener('click', () => scrollGallery(1));
});

// Camera & Detection
async function startFaceDetection() {
    const cameraContainer = document.querySelector('.camera-container');
    const placeholder = document.getElementById('placeholder');
    placeholder.style.display = 'none';

    const video = document.createElement('video');
    video.setAttribute('id', 'webcam');
    video.setAttribute('autoplay', true);
    video.setAttribute('playsinline', true);
    video.style.width = '100%';
    video.style.borderRadius = '10px';
    video.style.transform = 'scaleX(-1)';
    cameraContainer.appendChild(video);const canvas = document.getElementById('scanLine');
    const ctx = canvas.getContext('2d');

    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = webcamStream;
        video.onloadedmetadata = () => {
            video.play();
            animateScanLine(ctx, canvas);
            detectFace(video, ctx);
        };
    } catch (err) {
        console.error("Camera access error:", err);
        showNotification("Camera access denied");
    }
}

// Scanning line animation
function animateScanLine(ctx, canvas) {
    let y = 0;
    function drawLine() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        y = (y + 2) % canvas.height;
        requestAnimationFrame(drawLine);
    }
    drawLine();
}

// Detect face + analyze
async function detectFace(video, ctx) {
    const overlay = document.getElementById('faceOverlay');
    const canvas = document.getElementById('scanLine');

    function stopEverything() {
        const tracks = webcamStream?.getTracks();
        if (tracks) tracks.forEach(track => track.stop());
        video.remove();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const interval = setInterval(async () => {
        if (video.readyState === 4 && model) {
            const predictions = await model.estimateFaces(video, false);
            overlay.innerHTML = '';

            if (predictions.length > 0) {
                const face = predictions[0];
                const [x, y] = face.topLeft;
                const [x2, y2] = face.bottomRight;
                const width = x2 - x;
                const height = y2 - y;

                // Draw box
                const box = document.createElement('div');
                box.style.position = 'absolute';
                box.style.left = `${x}px`;
                box.style.top = `${y}px`;
                box.style.width = `${width}px`;
                box.style.height = `${height}px`;
                box.style.border = '2px solid gold';
                box.style.borderRadius = '10px';
                overlay.appendChild(box);

                // Simple Face Shape Estimation
                document.getElementById('faceShape').textContent = estimateFaceShape(face);
                document.getElementById('forehead').textContent = 'Medium';
                document.getElementById('jawline').textContent = 'Defined';
                document.getElementById('cheekbones').textContent = 'High';

                showNotification("Face analysis complete!");

                // Stop detection
                clearInterval(interval);
                stopEverything();

                // Go to hairstyle section
                setTimeout(() => {
                    showSection('hairstyles');
                    document.getElementById('hairstylesSection').scrollIntoView({ behavior: 'smooth' });
                }, 800);
            }
        }
    }, 300);
}

function estimateFaceShape(face) {
    const [x1, y1] = face.topLeft;
    const [x2, y2] = face.bottomRight;
    const width = x2 - x1;
    const height = y2 - y1;

    const ratio = width / height;
    if (ratio > 0.9) return "Round";
    if (ratio < 0.75) return "Oval";
    return "Square";
}

// Fake 3D Preview (mock)
function show3DPreview(style) {
    const preview = document.getElementById('styledPreview');
    const imgURL = `https://via.placeholder.com/400x400.png?text=Your+Face+with+${encodeURIComponent(style)}`;
    preview.innerHTML = `
        <h3>Here’s how you look with ${style}</h3>
        <img src="${imgURL}" style="max-width: 100%; border-radius: 10px;">
    `;
    preview.scrollIntoView({ behavior: 'smooth' });
}

// Upload (no change)
document.addEventListener('DOMContentLoaded', () => {
    const scanButton = document.getElementById('scanButton');
    const fileInput = document.getElementById('fileInput');
    const placeholder = document.getElementById('placeholder');

    scanButton.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                placeholder.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; border-radius: 10px;">`;
                setTimeout(() => {
                    document.getElementById('faceShape').textContent = 'Oval';
                    document.getElementById('forehead').textContent = 'Medium';
                    document.getElementById('jawline').textContent = 'Defined';
                    document.getElementById('cheekbones').textContent = 'High';
                    showNotification('Face analysis complete!');
                }, 1500);
            };
            reader.readAsDataURL(file);
        }
    });
});

// Notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    notificationText.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Scroll nav
function scrollGallery(direction) {
    const grid = document.querySelector('.hairstyles-grid');
    grid.scrollBy({ left: direction * 200, behavior: 'smooth' });
}
