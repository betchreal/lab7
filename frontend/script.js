document.addEventListener("DOMContentLoaded", () => {
    const playButton = document.getElementById("play-button");
    const workZone = document.getElementById("work-zone");
    const textBlock = document.querySelector(".text-block3");

    const startButton = document.getElementById("start-button");
    const animZone = document.getElementById("anim");
    const messages = document.getElementById("messages");

    let animationId = null;
    let balls = [];
    let isAnimating = false;
    let eventCounter = 0;

    let collisionThrottleTime = 500;
    let lastCollisionTime = 0;

    const logEvent = (eventType, details) => {
        const eventTime = new Date().toISOString();
        messages.textContent = `${++eventCounter}: ${eventType} - ${details} at ${eventTime}`;

        const storedEvents = JSON.parse(localStorage.getItem("events")) || [];
        storedEvents.push({
            id: eventCounter,
            type: eventType,
            details: details,
            time: eventTime,
        });
        localStorage.setItem("events", JSON.stringify(storedEvents));

        fetch("https://lab7.up.railway.app/api/events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: eventCounter,
                type: eventType,
                details: details,
                time: eventTime,
            }),
        }).catch((error) => {
            console.error("Error logging event:", error);
        });
    };

    playButton.addEventListener("click", async () => {
        if (workZone.classList.contains("hidden")) {
            workZone.classList.remove("hidden");
            textBlock.classList.add("hidden");
            playButton.textContent = "Close";
            logEvent("Button Click", "Work zone opened");
        } else {
            workZone.classList.add("hidden");
            textBlock.classList.remove("hidden");
            playButton.textContent = "Play";
            logEvent("Button Click", "Work zone closed");

            cancelAnimationFrame(animationId);
            balls.forEach((ball) => ball.element.remove());
            balls = [];
            startButton.textContent = "Start";
            isAnimating = false;

            try {
                const response = await fetch("https://lab7.up.railway.app/api/events");
                if (!response.ok) {
                    throw new Error("Failed to fetch events");
                }
                const data = await response.json();
                const localEvents = JSON.parse(localStorage.getItem("events")) || [];
                displayEvents(data.events, localEvents);
                localStorage.removeItem("events");
                eventCounter = 0;
            } catch (error) {
                console.error("Error fetching events:", error);
            }
        }
    });

    const displayEvents = (serverEvents, localStorageEvents) => {
        const container = document.createElement("div");
        container.style.display = "flex";
        container.style.justifyContent = "space-between";
        container.style.gap = "20px";

        const createTable = (title, events) => {
            const tableContainer = document.createElement("div");
            tableContainer.style.width = "45%";

            const titleElement = document.createElement("h3");
            titleElement.textContent = title;
            tableContainer.appendChild(titleElement);

            const table = document.createElement("table");
            table.style.width = "100%";
            table.style.borderCollapse = "collapse";

            table.innerHTML = `
            <tr>
                <th style="border: 1px solid #000; padding: 5px;">#</th>
                <th style="border: 1px solid #000; padding: 5px;">Type</th>
                <th style="border: 1px solid #000; padding: 5px;">Details</th>
                <th style="border: 1px solid #000; padding: 5px;">Time</th>
            </tr>
        `;

            events.forEach((event) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                <td style="border: 1px solid #000; padding: 5px;">${event.id}</td>
                <td style="border: 1px solid #000; padding: 5px;">${event.type}</td>
                <td style="border: 1px solid #000; padding: 5px;">${event.details}</td>
                <td style="border: 1px solid #000; padding: 5px;">${new Date(event.time).toLocaleString()}</td>
            `;
                table.appendChild(row);
            });

            tableContainer.appendChild(table);
            return tableContainer;
        };

        const serverTable = createTable("Server Events", serverEvents);
        const localStorageTable = createTable("LocalStorage Events", localStorageEvents);

        container.appendChild(serverTable);
        container.appendChild(localStorageTable);

        textBlock.innerHTML = "";
        textBlock.appendChild(container);
    };


    const createBall = (color, x = null, y = null) => {
        const ball = document.createElement("div");
        ball.style.width = "20px";
        ball.style.height = "20px";
        ball.style.borderRadius = "50%";
        ball.style.backgroundColor = color;
        ball.style.position = "absolute";
        ball.style.left = x !== null ? `${x}px` : `${Math.random() * (animZone.offsetWidth - 20)}px`;
        ball.style.top = y !== null ? `${y}px` : `${Math.random() * (animZone.offsetHeight - 20)}px`;
        animZone.appendChild(ball);
        return { element: ball, dx: 5, dy: 5 };
    };

    const animateBalls = () => {
        const currentTime = Date.now();

        balls.forEach((ball) => {
            const rect = ball.element.getBoundingClientRect(); // для знаходження координат на сторінці
            const parentRect = animZone.getBoundingClientRect();

            if (rect.left <= parentRect.left || rect.right >= parentRect.right) {
                ball.dx *= -1;
                if (currentTime - lastCollisionTime > collisionThrottleTime) {
                    logEvent("Ball Collision", `Ball hit vertical wall at (${Math.round(ball.element.offsetLeft)}, ${Math.round(ball.element.offsetTop)})`);
                    lastCollisionTime = currentTime;
                }
            }
            if (rect.top <= parentRect.top || rect.bottom >= parentRect.bottom) {
                ball.dy *= -1;
                if (currentTime - lastCollisionTime > collisionThrottleTime) {
                    logEvent("Ball Collision", `Ball hit horizontal wall at (${Math.round(ball.element.offsetLeft)}, ${Math.round(ball.element.offsetTop)})`);
                    lastCollisionTime = currentTime;
                }
            }

            ball.element.style.left = `${ball.element.offsetLeft + ball.dx}px`; // для переміщення кульки
            ball.element.style.top = `${ball.element.offsetTop + ball.dy}px`;
        });

        animationId = requestAnimationFrame(animateBalls); // Викликається 60 разів в секунду для утворення анімації, а id для її зупинки
    };

    const resetBalls = (randomize = false) => {
        balls.forEach((ball) => ball.element.remove());
        balls = randomize
            ? [createBall("yellow"), createBall("red")]
            : balls.map((ball) => createBall(ball.element.style.backgroundColor, ball.element.offsetLeft, ball.element.offsetTop));
        logEvent("Reset Balls", randomize ? "Balls reset with random positions" : "Balls reset with current positions");
    };

    startButton.addEventListener("click", () => {
        if (startButton.textContent === "Start") {
            if (balls.length === 0) {
                balls = [createBall("yellow"), createBall("red")];
            }
            animateBalls();
            isAnimating = true;
            startButton.textContent = "Reload";
            logEvent("Animation Start", "Balls started moving");
        } else if (startButton.textContent === "Reload") {
            cancelAnimationFrame(animationId);
            resetBalls(true);
            isAnimating = false;
            logEvent("Animation Reload", "Balls reloaded");
            startButton.textContent = "Start";
        }
    });

    const handleResize = () => {
        if (isAnimating) {
            cancelAnimationFrame(animationId);
            resetBalls(true);
            animateBalls();
            logEvent("Window Resize", "Balls repositioned due to resize");
        }
    };

    window.addEventListener("resize", handleResize);
});
