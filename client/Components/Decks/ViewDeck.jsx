import React from 'react';
import { Trans } from 'react-i18next';
import { ButtonGroup, Col } from 'react-bootstrap';

import ConfirmButton from '../Form/ConfirmButton';
import DeckSummary from './DeckSummary';
import Panel from '../Site/Panel';
import { deleteDeck, navigate } from '../../redux/actions';
import { useDispatch } from 'react-redux';

/**
 * @typedef ViewDeckProps
 * @property {import('./DeckList').Deck} deck The currently selected deck
 */

/**
 * @param {ViewDeckProps} props
 */
const ViewDeck = ({ deck }) => {
    const dispatch = useDispatch();

    const handleDeleteClick = () => {
        dispatch(deleteDeck(deck));
    };
    const handleEditClick = () => {
        dispatch(navigate('/decks/edit'));
    };

    return (
        <Panel title={deck?.name}>
            <Col xs={12} className='text-center'>
                <ButtonGroup>
                    <button className='btn btn-primary' onClick={handleEditClick}>
                        Edit
                    </button>

                    <ConfirmButton onClick={handleDeleteClick}>
                        <Trans>Delete</Trans>
                    </ConfirmButton>
                </ButtonGroup>
            </Col>
            <DeckSummary deck={deck} />
        </Panel>
    );
};

export default ViewDeck;
