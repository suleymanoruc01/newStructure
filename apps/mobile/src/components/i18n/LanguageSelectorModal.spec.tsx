import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import { LanguageSelectorModal } from './LanguageSelectorModal';
import * as localeManager from '../../shared/i18n/locale-manager';

describe('LanguageSelectorModal', () => {
  let changeLanguageSpy: jest.SpyInstance;
  let getCurrentLanguageSpy: jest.SpyInstance;

  beforeEach(() => {
    changeLanguageSpy = jest
      .spyOn(localeManager, 'changeLanguage')
      .mockResolvedValue();
    getCurrentLanguageSpy = jest
      .spyOn(localeManager, 'getCurrentLanguage')
      .mockReturnValue('tr-TR');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders language options when visible', () => {
    const onClose = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LanguageSelectorModal visible={true} onClose={onClose} />,
      );
    });

    const root = renderer!.root;
    const modal = root.findByProps({ testID: 'm.language.modal' });
    expect(modal).toBeTruthy();

    const trOption = root.findByProps({ testID: 'm.language.option.tr-TR' });
    const enOption = root.findByProps({ testID: 'm.language.option.en-US' });
    expect(trOption).toBeTruthy();
    expect(enOption).toBeTruthy();
  });

  it('selects en-US and calls changeLanguage and onClose', async () => {
    const onClose = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LanguageSelectorModal visible={true} onClose={onClose} />,
      );
    });

    const root = renderer!.root;
    const enOption = root.findByProps({ testID: 'm.language.option.en-US' });

    await ReactTestRenderer.act(async () => {
      enOption.props.onPress();
    });

    expect(changeLanguageSpy).toHaveBeenCalledWith('en-US');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes modal when cancel button is pressed', () => {
    const onClose = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LanguageSelectorModal visible={true} onClose={onClose} />,
      );
    });

    const root = renderer!.root;
    const cancelBtn = root.findByProps({ testID: 'm.language.button.cancel' });

    ReactTestRenderer.act(() => {
      cancelBtn.props.onPress();
    });

    expect(onClose).toHaveBeenCalled();
  });
});
