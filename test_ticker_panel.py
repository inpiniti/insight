#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
import time

def test_ticker_panel():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        # Navigate to portfolio page
        page.goto("http://localhost:3000/portfolio")
        page.wait_for_load_state("networkidle")

        # Take initial screenshot
        page.screenshot(path="/tmp/portfolio_initial.png", full_page=True)
        print("Initial portfolio screenshot saved")

        # Find and click the first ticker row (AAPL)
        ticker_rows = page.locator(".pf-row-clickable")
        print(f"Found {ticker_rows.count()} ticker rows")

        if ticker_rows.count() > 0:
            # Click first ticker
            ticker_rows.first.click()
            page.wait_for_timeout(500)  # Wait for modal animation

            # Check if detail panel is visible
            detail_panel = page.locator(".detail-panel")
            if detail_panel.is_visible():
                print("[PASS] Detail panel opened successfully")
                page.screenshot(path="/tmp/ticker_panel_open.png", full_page=False)

                # Check for key elements
                ticker_text = page.locator(".detail-ticker")
                price_text = page.locator(".detail-price")
                buy_button = page.locator(".trade-btn.buy")
                sell_button = page.locator(".trade-btn.sell")

                print(f"  Ticker: {ticker_text.text_content()}")
                print(f"  Price: {price_text.text_content()}")
                print(f"  Buy button visible: {buy_button.is_visible()}")
                print(f"  Sell button visible: {sell_button.is_visible()}")

                # Test clicking buy button
                if buy_button.is_visible():
                    buy_button.click()
                    page.wait_for_timeout(500)

                    # Check if trade modal opened
                    trade_modal = page.locator(".trade-modal")
                    if trade_modal.is_visible():
                        print("[PASS] Trade modal opened successfully")
                        page.screenshot(path="/tmp/trade_modal_open.png", full_page=False)

                        # Check trade modal elements
                        mode_pill = page.locator(".trade-mode-pill")
                        price_buttons = page.locator(".trade-price-segs button")
                        qty_input = page.locator(".trade-input")
                        confirm_btn = page.locator(".trade-confirm")

                        print(f"  Mode pill: {mode_pill.text_content()}")
                        print(f"  Price buttons count: {price_buttons.count()}")
                        print(f"  Confirm button visible: {confirm_btn.is_visible()}")
                    else:
                        print("[FAIL] Trade modal not visible")

                # Test escape key
                page.keyboard.press("Escape")
                page.wait_for_timeout(300)

                if not trade_modal.is_visible():
                    print("[PASS] Escape key closed trade modal")

                page.keyboard.press("Escape")
                page.wait_for_timeout(300)

                if not detail_panel.is_visible():
                    print("[PASS] Escape key closed detail panel")
                else:
                    print("[FAIL] Detail panel still visible after escape")
            else:
                print("[FAIL] Detail panel not visible")
                page.screenshot(path="/tmp/error_panel_not_visible.png", full_page=True)

        browser.close()
        print("\nTest completed")

if __name__ == "__main__":
    test_ticker_panel()
