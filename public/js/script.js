class Loader {
  constructor(parentElement, isFixed = false) {
    this.parentElement = parentElement;
    this.isFixed = isFixed;
    this.element = document.createElement('div');
    this.element.classList.add('loader');
    if (this.isFixed) {
      this.element.classList.add('fixed');
    }
  }
  show(isEmptyEl = false) {
    if (this.isFixed) {
      document.body.appendChild(this.element);
      document.querySelector('.overlay').style.display = 'block';
    } else {
      if (isEmptyEl) this.parentElement.innerHTML = '';
      this.parentElement.appendChild(this.element);
    }
  }
  hide() {
    this.element.remove();
    document.querySelector('.overlay').style.display = 'none';
  }
};


// Get the modal
const modal = document.getElementById("myModal");
const btnCloseModal = modal.querySelector('.btn-close');

const openModal = () => {
  modal.style.display = 'block';
  document.body.style.overflow = "hidden";
}

const hideModal = () => {
  modal.style.display = 'none';
  document.body.style.overflow = "auto";
};

// When the user clicks close button
btnCloseModal.onclick = function() {
  hideModal();
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    hideModal();
  }
}
