document.addEventListener('DOMContentLoaded', () => {
    fetch('/html/_header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load header: ' + response.statusText);
            }
            return response.text();
        })
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');

            const headerTopElement = doc.querySelector('.header-top');
            const headerBottomElement = doc.querySelector('.header-bottom');
            
            const headerPlaceholder = document.getElementById('header-placeholder');

            if (headerPlaceholder) {
                if (headerTopElement) {
                    headerPlaceholder.innerHTML = headerTopElement.outerHTML;
                }
                
                if (headerBottomElement) {
                    headerPlaceholder.insertAdjacentHTML('afterend', headerBottomElement.outerHTML);
                }

                setTimeout(() => {
                    const topContainer = document.querySelector('.header-top');
                    const bottomContainer = document.querySelector('.header-bottom');
                    
                    if (topContainer && bottomContainer) {
                        initializeDropdowns(bottomContainer);
                        initializeDropdownImages(bottomContainer);
                        
                        // IntersectionObserverの代わりに、scrollイベントリスナーを追加
                        const headerTopHeight = topContainer.offsetHeight;

                        window.addEventListener('scroll', () => {
                            if (window.scrollY > headerTopHeight) {
                                bottomContainer.classList.add('is-stuck');
                            } else {
                                bottomContainer.classList.remove('is-stuck');
                            }
                        });
                    }
                }, 50);
            } else {
                console.error("Error: Element with id 'header-placeholder' not found.");
            }
        })
        .catch(error => {
            console.error('Error fetching header:', error);
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = '<p>ヘッダーの読み込みに失敗しました。</p>';
            }
        });
});

function initializeDropdowns(container) {
    const navItemsWithDropdown = container.querySelectorAll('.nav-item.has-dropdown');
    const dropdownMenus = document.querySelectorAll('.dropdown-menu');
    let activeDropdown = null;
    let timeoutId = null;

    navItemsWithDropdown.forEach(navItem => {
        const targetId = navItem.dataset.dropdownTarget;
        const targetDropdown = document.querySelector(`#${targetId}`);

        navItem.addEventListener('mouseenter', () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            dropdownMenus.forEach(menu => {
                menu.classList.remove('is-visible');
            });

            if (targetDropdown) {
                targetDropdown.classList.add('is-visible');
                activeDropdown = targetDropdown;
            }
        });

        navItem.addEventListener('mouseleave', () => {
            timeoutId = setTimeout(() => {
                if (activeDropdown && !navItem.matches(':hover') && !activeDropdown.matches(':hover')) {
                    activeDropdown.classList.remove('is-visible');
                    activeDropdown = null;
                }
            }, 150);
        });
    });

    dropdownMenus.forEach(menu => {
        menu.addEventListener('mouseleave', () => {
            if (activeDropdown) {
                activeDropdown.classList.remove('is-visible');
                activeDropdown = null;
            }
        });
    });
}

function initializeDropdownImages(container) {
    const dropdownLinks = container.querySelectorAll('.dropdown-list a');
    const dropdownImageContainer = document.querySelector('.dropdown-image-container');
    const dropdownImage = dropdownImageContainer ? dropdownImageContainer.querySelector('img') : null;
    const dropdownDescription = dropdownImageContainer ? dropdownImageContainer.querySelector('p') : null;

    if (!dropdownImage || !dropdownDescription) return;

    dropdownLinks.forEach(link => {
        const imageUrl = link.getAttribute('data-image');
        const description = link.getAttribute('data-description');
        
        link.addEventListener('mouseenter', () => {
            if (imageUrl) {
                dropdownImage.src = imageUrl;
                dropdownDescription.textContent = description;
                dropdownImageContainer.classList.add('is-visible');
            }
        });
        
        link.addEventListener('mouseleave', () => {
            const isHoveringAnotherLink = Array.from(dropdownLinks).some(otherLink => otherLink.matches(':hover'));
            if (!isHoveringAnotherLink) {
                dropdownImageContainer.classList.remove('is-visible');
            }
        });
    });

    const productDropdown = container.querySelector('#product-dropdown');
    if (productDropdown) {
        productDropdown.addEventListener('mouseleave', () => {
            dropdownImageContainer.classList.remove('is-visible');
        });
    }
}