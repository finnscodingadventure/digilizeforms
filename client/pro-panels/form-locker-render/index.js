// FormLockerPromo.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedProLabel, ProFeatureBanner } from "@quillforms/admin-components";
import { __ } from '@wordpress/i18n';
import './style.css';

const FormLockerPromo = () => {
	const [activeFeature, setActiveFeature] = useState('password');

	const features = {
		password: {
			icon: (
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
					<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="currentColor" />
				</svg>
			),
			title: __('Password Protection', 'quillforms'),
			description: __('Secure forms with password access', 'quillforms'),
			demo: (
				<div className="form-locker-password-demo">
					<div className="form-locker-password-prompt">
						<div className="form-locker-lock-icon">🔒</div>
						<h3>{__('This form is password protected', 'quillforms')}</h3>
						<div className="form-locker-password-input">
							<input type="password" placeholder={__('Enter password', 'quillforms')} />
							<button>{__('Access Form', 'quillforms')}</button>
						</div>
					</div>
				</div>
			)
		},
		schedule: {
			icon: (
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
					<path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM7 12h5v5H7v-5z" fill="currentColor" />
				</svg>
			),
			title: __('Schedule Access', 'quillforms'),
			description: __('Control form availability by date and time', 'quillforms'),
			demo: (
				<div className="form-locker-schedule-demo">
					<div className="form-locker-calendar">
						<div className="form-locker-calendar-header">
							<h4>{__('Form Availability', 'quillforms')}</h4>
						</div>
						<div className="form-locker-calendar-dates">
							<div className="form-locker-date-range">
								<div className="form-locker-date start">
									<span>{__('Starts', 'quillforms')}</span>
									<strong>Jan 1, 2024</strong>
								</div>
								<div className="form-locker-date-arrow">→</div>
								<div className="form-locker-date end">
									<span>{__('Ends', 'quillforms')}</span>
									<strong>Jan 31, 2024</strong>
								</div>
							</div>
						</div>
					</div>
				</div>
			)
		},
		users: {
			icon: (
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
					<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm6 5H6v-.99c.2-.72 3.3-2.01 6-2.01s5.8 1.29 6 2v1z" fill="currentColor" />
				</svg>
			),
			title: __('User Restriction', 'quillforms'),
			description: __('Limit access to logged-in users only', 'quillforms'),
			demo: (
				<div className="form-locker-users-demo">
					<div className="form-locker-login-prompt">
						<div className="form-locker-user-icon">👤</div>
						<h3>{__('Members Only', 'quillforms')}</h3>
						<p>{__('Please log in to access this form', 'quillforms')}</p>
						<button className="form-locker-login-button">{__('Log In', 'quillforms')}</button>
					</div>
				</div>
			)
		},
		limit: {
			icon: (
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
					<path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" fill="currentColor" />
				</svg>
			),
			title: __('Entry Limits', 'quillforms'),
			description: __('Set maximum number of submissions', 'quillforms'),
			demo: (
				<div className="form-locker-limit-demo">
					<div className="form-locker-limit-status">
						<div className="form-locker-limit-progress">
							<div className="form-locker-limit-bar" style={{ width: '80%' }}></div>
						</div>
						<div className="form-locker-limit-numbers">
							<span>{__('80 of 100 responses', 'quillforms')}</span>
							<span className="form-locker-limit-remaining">{__('20 spots left', 'quillforms')}</span>
						</div>
					</div>
				</div>
			)
		},
		duplicate: {
			icon: (
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
					<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor" />
				</svg>
			),
			title: __('Duplicate Prevention', 'quillforms'),
			description: __('Block multiple submissions by email, phone, or IP address', 'quillforms'),
			demo: (
				<div className="form-locker-duplicate-demo">
					<div className="form-locker-duplicate-header">
						<h4>{__('Submission Tracking', 'quillforms')}</h4>
					</div>
					<div className="form-locker-duplicate-checks">
						<div className="form-locker-check-item">
							<div className="form-locker-check-icon">✉️</div>
							<div className="form-locker-check-details">
								<h5>{__('Email Verification', 'quillforms')}</h5>
								<p>{__('Prevent multiple submissions from same email address', 'quillforms')}</p>
							</div>
						</div>
						<div className="form-locker-check-item">
							<div className="form-locker-check-icon">📱</div>
							<div className="form-locker-check-details">
								<h5>{__('Phone Number Check', 'quillforms')}</h5>
								<p>{__('Block duplicate phone numbers across submissions', 'quillforms')}</p>
							</div>
						</div>
						<div className="form-locker-check-item">
							<div className="form-locker-check-icon">🌐</div>
							<div className="form-locker-check-details">
								<h5>{__('IP Tracking', 'quillforms')}</h5>
								<p>{__('Track submissions from the same IP address', 'quillforms')}</p>
							</div>
						</div>
					</div>
					<div className="form-locker-duplicate-alert">
						<div className="form-locker-alert-icon">⚠️</div>
						<div className="form-locker-alert-content">
							<h4>{__('Duplicate Submission Detected', 'quillforms')}</h4>
							<div className="form-locker-alert-details">
								<span className="form-locker-alert-type">{__('Email:', 'quillforms')}</span> user@example.com
								<span className="form-locker-alert-type">{__('IP:', 'quillforms')}</span> 192.168.1.1
							</div>
						</div>
					</div>
				</div>
			)
		}
	};

	return (
		<div className="form-locker-container" >
			<EnhancedProLabel />

			<h1 className="form-locker-title">{__('Form Locker', 'quillforms')}</h1>
			<p className="form-locker-subtitle">
				{__('Advanced access control and submission restrictions for your forms', 'quillforms')}
			</p>

			<div className="form-locker-demo">
				<div className="form-locker-features-nav">
					{Object.entries(features).map(([key, feature]) => (
						<button
							key={key}
							className={`form-locker-feature-button ${activeFeature === key ? 'active' : ''}`}
							onClick={() => setActiveFeature(key)}
						>
							<span className="form-locker-feature-icon">{feature.icon}</span>
							<span className="form-locker-feature-text">
								<span className="form-locker-feature-title">{feature.title}</span>
								<span className="form-locker-feature-desc">{feature.description}</span>
							</span>
						</button>
					))}
				</div>

				<div className="form-locker-preview">
					<AnimatePresence mode="wait">
						<motion.div
							key={activeFeature}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							className="form-locker-preview-content"
						>
							{features[activeFeature].demo}
						</motion.div>
					</AnimatePresence>
				</div>
			</div>
			{/* 
			<div className="form-locker-upgrade-prompt">
				<div className="form-locker-upgrade-content">
					<div className="form-locker-upgrade-icon">🛡️</div>
					<h3 className="form-locker-upgrade-title">Upgrade to Pro</h3>
					<p className="form-locker-upgrade-desc">
						Get complete control over your form access and submissions
					</p>
					<button className="form-locker-upgrade-button">
						Unlock Form Locker
					</button>
				</div>
			</div> */}

			<ProFeatureBanner
				featureName={__('Form Locker', 'quillforms')}
				addonSlug="formlocker"
			/>
		</div >
	);
};

export default FormLockerPromo;