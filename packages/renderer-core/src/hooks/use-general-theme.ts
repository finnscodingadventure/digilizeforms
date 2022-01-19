/**
 * QuillForms Dependencies
 */
import { FormTheme } from '@quillforms/types/src';
import { getDefaultThemeProperties } from '@quillforms/utils';

/*
 * Internal Dependencies
 */
import useFormContext from './use-form-context';

const useGeneralTheme = () => {
	const {
		formObj: { themeId, themesList },
	} = useFormContext();
	let appliedThemeId = themeId;

	let appliedTheme = themesList.find(
		( $theme ) => $theme.id === appliedThemeId
	)?.properties;
	if ( ! appliedTheme ) {
		appliedTheme = {};
	}
	return {
		...getDefaultThemeProperties(),
		...appliedTheme,
	} as FormTheme;
};

export default useGeneralTheme;
