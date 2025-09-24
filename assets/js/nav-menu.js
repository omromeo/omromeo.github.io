// nav-menu.js
fetch('assets//html/navbar.html')
  .then(r => r.text())
  .then(html => {
    document.getElementById('navbar').innerHTML = html;

    // ===== Hamburger toggle (mobile) =====
    const hamburger = document.getElementById('hamburger');
    const navMenu   = document.getElementById('nav-menu');
    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      hamburger.classList.toggle('open'); // <-- toggle this class
    });
    }

    // ===== Mobile dropdown arrows toggle =====
    const dropdowns = document.querySelectorAll('.top-nav-right li.dropdown');

    dropdowns.forEach(li => {
      const arrow = li.querySelector('.dropdown-arrow');
      const submenu = li.querySelector('.dropdown-content');

      if (!arrow || !submenu) return;

      // Replace the old arrow click handler with this block (minimal change)
      arrow.addEventListener('click', (e) => {
        e.preventDefault(); // stop navigation if any

        // detect small screens the same way your CSS does
        const isSmallScreen = window.matchMedia('(max-width: 1200px)').matches;

        // Clear any inline height left by desktop handlers to avoid conflicts
        submenu.style.height = '';

        // SMALL-SCREEN: animate open/close using max-height + opacity for immediate effect
        if (isSmallScreen) {
          const isOpen = submenu.classList.contains('active');

          if (isOpen) {
            // collapse: set current height then animate to 0
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
            // force layout then animate
            requestAnimationFrame(() => {
              submenu.style.transition = 'max-height 0.35s ease, opacity 0.25s ease';
              submenu.style.maxHeight = '0px';
              submenu.style.opacity = '0';
            });

            // cleanup after transition
            const onCloseEnd = (ev) => {
              if (ev.propertyName === 'max-height') {
                submenu.classList.remove('active');
                submenu.style.maxHeight = '';
                submenu.style.opacity = '';
                submenu.style.transition = '';
                submenu.removeEventListener('transitionend', onCloseEnd);
              }
            };
            submenu.addEventListener('transitionend', onCloseEnd);
            arrow.classList.remove('open');
          } else {
            // expand: mark active then animate from 0 -> scrollHeight
            submenu.classList.add('active');
            submenu.style.maxHeight = '0px';
            submenu.style.opacity = '0';

            requestAnimationFrame(() => {
              const target = submenu.scrollHeight + 'px';
              submenu.style.transition = 'max-height 0.35s ease, opacity 0.25s ease';
              submenu.style.maxHeight = target;
              submenu.style.opacity = '1';
            });

            const onOpenEnd = (ev) => {
              if (ev.propertyName === 'max-height') {
                // allow natural height after open
                submenu.style.maxHeight = '';
                submenu.style.transition = '';
                submenu.removeEventListener('transitionend', onOpenEnd);
              }
            };
            submenu.addEventListener('transitionend', onOpenEnd);
            arrow.classList.add('open');
          }

          return; // done for small screens
        }

        // NOT small screen: keep original simple behavior (no desktop hover interference)
        submenu.classList.toggle('active');
        arrow.classList.toggle('open');
      });

    });


    // ===== Desktop dropdown animation =====
    const mqDesktop = window.matchMedia('(min-width: 1201px)');
    let cleanupFns = [];

    function wireDesktopDropdowns() {
      // remove any previous listeners when re-wiring (on resize)
      cleanupFns.forEach(fn => fn());
      cleanupFns = [];

      if (!mqDesktop.matches) {
        // On mobile, ensure inline heights are cleared
        document.querySelectorAll('.top-nav-right li.dropdown .dropdown-content')
          .forEach(menu => { menu.style.height = ''; });
        return;
      }

      document.querySelectorAll('.top-nav-right li.dropdown').forEach(li => {
        const trigger = li.querySelector(':scope > a');       // main link
        const menu    = li.querySelector('.dropdown-content'); // submenu
        if (!trigger || !menu) return;

        let closingTimer;

        const open = () => {
          clearTimeout(closingTimer);
          // set to content height for animation
          menu.style.height = menu.scrollHeight + 'px';
          li.classList.add('open');
          // after the open transition ends, set height to auto for flexibility
          const onEnd = (e) => {
            if (e.propertyName === 'height' && li.classList.contains('open')) {
              menu.style.height = 'auto';
              menu.removeEventListener('transitionend', onEnd);
            }
          };
          menu.addEventListener('transitionend', onEnd);
        };

        const close = () => {
          // if height is auto, fix it to a pixel value first, then animate to 0
          const current = menu.getBoundingClientRect().height;
          menu.style.height = current + 'px';
          // next frame → collapse
          requestAnimationFrame(() => {
            li.classList.remove('open');
            menu.style.height = '0px';
          });
        };

        // Hover / focus handling (desktop)
        const onEnter = () => open();
        const onLeave = () => {
          // small delay to allow moving cursor into submenu without flicker
          closingTimer = setTimeout(close, 60);
        };

        li.addEventListener('mouseenter', onEnter);
        li.addEventListener('mouseleave', onLeave);

        // Keyboard accessibility
        trigger.addEventListener('focus', open);
        menu.addEventListener('focusout', (e) => {
          if (!li.contains(e.relatedTarget)) close();
        });

        // Cleanup function for this dropdown
        cleanupFns.push(() => {
          li.removeEventListener('mouseenter', onEnter);
          li.removeEventListener('mouseleave', onLeave);
          trigger.removeEventListener('focus', open);
          menu.ontransitionend = null;
          clearTimeout(closingTimer);
          menu.style.height = '';
          li.classList.remove('open');
        });
      });
    }

    wireDesktopDropdowns();
    mqDesktop.addEventListener('change', wireDesktopDropdowns);
  })
  .catch(err => console.error('Error loading navbar:', err));
