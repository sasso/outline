// @flow
import React, { Component } from 'react';
import { Portal } from 'react-portal';
import { findDOMNode, Node } from 'slate';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import styled from 'styled-components';
import { color } from 'shared/styles/constants';
import PlusIcon from 'components/Icon/PlusIcon';
import type { State } from '../types';

type Props = {
  state: State,
  onChange: Function,
  onInsertImage: File => Promise<*>,
};

function findClosestRootNode(state, ev) {
  let previous;

  for (const node of state.document.nodes) {
    const element = findDOMNode(node);
    const bounds = element.getBoundingClientRect();
    if (bounds.top > ev.clientY) return previous;
    previous = { node, element, bounds };
  }
}

@observer
export default class BlockInsert extends Component {
  props: Props;
  mouseMoveTimeout: number;
  mouseMovementSinceClick: number = 0;
  lastClientX: number = 0;
  lastClientY: number = 0;

  @observable closestRootNode: Node;
  @observable active: boolean = false;
  @observable top: number;
  @observable left: number;

  componentDidMount = () => {
    window.addEventListener('mousemove', this.handleMouseMove);
  };

  componentWillUnmount = () => {
    window.removeEventListener('mousemove', this.handleMouseMove);
  };

  setInactive = () => {
    this.active = false;
  };

  handleMouseMove = (ev: SyntheticMouseEvent) => {
    const windowWidth = window.innerWidth / 2.5;
    const result = findClosestRootNode(this.props.state, ev);
    const movementThreshold = 200;

    this.mouseMovementSinceClick +=
      Math.abs(this.lastClientX - ev.clientX) +
      Math.abs(this.lastClientY - ev.clientY);
    this.lastClientX = ev.clientX;
    this.lastClientY = ev.clientY;

    this.active =
      ev.clientX < windowWidth &&
      this.mouseMovementSinceClick > movementThreshold;

    if (result) {
      this.closestRootNode = result.node;

      // do not show block menu on title heading or editor
      const firstNode = this.props.state.document.nodes.first();
      if (result.node === firstNode || result.node.type === 'block-toolbar') {
        this.left = -1000;
      } else {
        this.left = Math.round(result.bounds.left - 20);
        this.top = Math.round(result.bounds.top + window.scrollY);
      }
    }

    if (this.active) {
      clearTimeout(this.mouseMoveTimeout);
      this.mouseMoveTimeout = setTimeout(this.setInactive, 2000);
    }
  };

  handleClick = (ev: SyntheticMouseEvent) => {
    this.mouseMovementSinceClick = 0;
    this.active = false;

    const { state } = this.props;
    const type = { type: 'block-toolbar', isVoid: true };
    let transform = state.transform();

    // remove any existing toolbars in the document as a fail safe
    state.document.nodes.forEach(node => {
      if (node.type === 'block-toolbar') {
        transform.removeNodeByKey(node.key);
      }
    });

    transform
      .collapseToStartOf(this.closestRootNode)
      .collapseToEndOfPreviousBlock()
      .insertBlock(type);

    this.props.onChange(transform.apply());
  };

  render() {
    const style = { top: `${this.top}px`, left: `${this.left}px` };

    return (
      <Portal>
        <Trigger active={this.active} style={style}>
          <PlusIcon onClick={this.handleClick} color={color.slate} />
        </Trigger>
      </Portal>
    );
  }
}

const Trigger = styled.div`
  position: absolute;
  z-index: 1;
  opacity: 0;
  background-color: ${color.white};
  transition: opacity 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275),
    transform 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  line-height: 0;
  margin-left: -10px;
  box-shadow: inset 0 0 0 2px ${color.slate};
  border-radius: 100%;
  transform: scale(0.9);
  cursor: pointer;

  &:hover {
    background-color: ${color.smokeDark};
  }

  ${({ active }) =>
    active &&
    `
    transform: scale(1);
    opacity: .9;
  `};
`;
