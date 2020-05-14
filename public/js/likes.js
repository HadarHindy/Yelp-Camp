const likeButton = document.querySelector("#like");
let liked = false;
let likesCounter = document.querySelector("#likesNumber");
let counter;

likeButton.addEventListener("click", () => {
	if (!liked) {
		counter = likesCounter.textContent + 1;
		likesCounter.textContent = counter;
		liked = true;
	}
	
	else {
		likesCounter.textContent = 2;
		liked = false;
	}
});

