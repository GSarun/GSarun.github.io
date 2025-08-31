document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const scoreDisplay = document.getElementById('score');
    let score = 0;

    // ฟังก์ชันสำหรับอัปเดตคะแนนบนหน้าจอ
    function updateScore(points) {
        score += points;
        scoreDisplay.textContent = score;
    }

    // ฟังก์ชันสำหรับสร้างวัตถุใหม่
    function createObject() {
        const object = document.createElement('div');
        object.classList.add('falling-object');

        // สุ่มตำแหน่งแนวนอนของวัตถุ
        const gameWidth = gameContainer.offsetWidth;
        const objectWidth = 50; // ต้องตรงกับ width ใน CSS
        const randomLeft = Math.random() * (gameWidth - objectWidth);
        object.style.left = `${randomLeft}px`;

        // กำหนดตำแหน่งเริ่มต้นที่ด้านบนสุด
        object.style.top = '-50px';

        // เพิ่มวัตถุลงในพื้นที่เกม
        gameContainer.appendChild(object);

        // เพิ่ม Event Listener สำหรับการคลิก
        object.addEventListener('click', () => {
            updateScore(10); // เพิ่ม 10 คะแนนเมื่อคลิกสำเร็จ
            object.remove(); // ลบวัตถุออกจากหน้าจอ
        });

        moveObject(object);
    }

    // ฟังก์ชันสำหรับทำให้วัตถุเคลื่อนที่ลงมา
    function moveObject(object) {
        let currentTop = parseInt(object.style.top, 10);
        const gameHeight = gameContainer.offsetHeight;

        const fallInterval = setInterval(() => {
            currentTop += 5; // ความเร็วในการตก
            object.style.top = `${currentTop}px`;

            // ตรวจสอบว่าวัตถุตกถึงพื้นหรือยัง
            if (currentTop > gameHeight) {
                object.remove(); // ลบวัตถุออกจากหน้าจอ
                clearInterval(fallInterval); // หยุดการเคลื่อนที่ของวัตถุนี้
                // ในเกมจริง อาจจะลดชีวิตตรงนี้
            }
        }, 20); // อัปเดตตำแหน่งทุกๆ 20 มิลลิวินาที
    }

    // เริ่มสร้างวัตถุทุกๆ 1 วินาที
    setInterval(createObject, 1000);
});
